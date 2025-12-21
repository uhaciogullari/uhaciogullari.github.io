class Node {
    constructor(length, suffix, id) {
        this.edges = new Map();
        this.suffix = suffix;
        this.length = length;
        this.palindrome = ""; //only needed to display the graph
        this.id = id;         //only needed to display the graph
    }
}

class Eertree {
    constructor() {
        this.imaginary = new Node(-1, null, 0, 1);
        this.imaginary.suffix = this.imaginary;
        this.empty = new Node(0, this.imaginary, 1, 2);
        this.maxSuffix = this.imaginary;
        this.accumulated = "";
        this.nodes = [this.imaginary, this.empty];  //only needed if we want to traverse it
    }

    add(ch) {
        const getMaxSuffixPalindrome = (startNode, c) => {
            for (let current = startNode; current !== this.imaginary; current = current.suffix) {
                const compare = this.accumulated.length - current.length - 1;
                if (compare >= 0 && this.accumulated[compare] === c) {
                    return current;
                }
            }
            return this.imaginary;
        };


        let length = 0;
        const maxSuffix = getMaxSuffixPalindrome(this.maxSuffix, ch);
        const createNewNode = !(maxSuffix.edges.has(ch));
        if (createNewNode) {
            const newNode = new Node(maxSuffix.length + 2, null, this.nodes.length);
            length = newNode.length;

            if (newNode.length === 1) {
                newNode.suffix = this.empty;
                newNode.palindrome = ch;
            } else {
                newNode.suffix = getMaxSuffixPalindrome(maxSuffix.suffix, ch).edges.get(ch);
                newNode.palindrome = ch + maxSuffix.palindrome + ch;
            }

            maxSuffix.edges.set(ch, newNode);
            this.nodes.push(newNode);
        }

        this.maxSuffix = maxSuffix.edges.get(ch);
        this.accumulated += ch;

        return length;
    }
}