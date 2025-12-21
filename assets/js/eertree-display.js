const display = (settings = {}) => {

    const defaults = {
        hideOddRoot: false,
        hideEvenRoot: false,
        hideSuffixLinks: false,
        markMaxSuffix: true,
        value: "",
        inputId: ""
    };

    settings = { ...defaults, ...settings };

    if (!document.getElementById(settings.targetId)){
        return;
    }

    if(settings.value) {
        render(settings.value, settings)
    } else if(settings.inputId) {
        const input = document.getElementById(settings.inputId);
        input.addEventListener("input", () => {
            render(input.value ||"", settings);
        });
        render(input.value || "", settings);
    }
}

const isNodeHidden = (id, settings) => {
    if (settings.hideOddRoot && id === 0) {
        return true;
    }
    if (settings.hideEvenRoot && id === 1) {
        return true;
    }

    return false;
}

const toGraphvizDot = (t, settings) => {
    const digraph = ["digraph {", "ranksep = 1.2;", "nodesep = 0.8;", "beautify=true;"]
    const nodes = []
    const edges = []
    t.nodes.forEach((node, index) => {
        if (isNodeHidden(node.id, settings)) {
            return;
        }

        const nodeLabel = node.palindrome !== "" ? node.palindrome : node.length;
        const isSpecialNode = node.length <= 0;
        const markMaxSuffix = settings.markMaxSuffix && t.maxSuffix == node;
        nodes.push(`${node.id} [label="${nodeLabel}"] ${isSpecialNode ? "[shape = doublecircle]" : ""} ${markMaxSuffix ? " [color=red]" : ""};`)

        if(!isNodeHidden(node.suffix.id, settings) && !settings.hideSuffixLinks) {
            edges.push(`${node.id} -> ${node.suffix.id} [color = steelblue] [constraint = false]; `)
        }

        for (const [key, val] of node.edges) {
            if (isNodeHidden(val.id, settings)) {
                continue;
            }
            edges.push(`${node.id} -> ${val.id} [label="${key}"] [labeldistance = 1.25];`)
        }
    });
    digraph.push(...nodes)
    digraph.push(...edges)
    digraph.push("}")
    return digraph.join("\n")
}



const render = (value, settings) => {
    const eertree = buildEertree(value);
    const dot = toGraphvizDot(eertree, settings)

    let viz = new Viz();
    viz.renderSVGElement(dot).then(svg => {
        let target = document.getElementById(settings.targetId);
        target.innerHTML = "";
        target.appendChild(svg);
    });
}

const buildEertree= (s) => {
    const eertree = new Eertree();
    for (let c of s) {
        eertree.add(c);
    }
    return eertree;
}

