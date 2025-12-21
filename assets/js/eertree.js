class Node {
    constructor(length, suffix, id) {
        this.edges = new Map();
        this.link = suffix;
        this.length = length;
        this.palindrome = "";
        this.id = id;
    }
}

class Eertree {
    constructor() {
        this.imaginary = new Node(-1, null, 0, 1);
        this.imaginary.link = this.imaginary;
        this.empty = new Node(0, this.imaginary, 1, 2);
        this.maxSuffix = this.imaginary;
        this.accumulated = "";
        this.nodes = [this.imaginary, this.empty];
    }

    add(ch) {
        const getMaxSuffixPalindrome = (startNode, c) => {
            for (let current = startNode; current !== this.imaginary; current = current.link) {
                const compare = this.accumulated.length - current.length - 1;
                if (compare >= 0 && this.accumulated[compare] === c) {
                    return current;
                }
            }
            return this.imaginary;
        };


        let maxSuffix = getMaxSuffixPalindrome(this.maxSuffix, ch);
        let createNewNode = !(maxSuffix.edges.has(ch));
        if (createNewNode) {
            let newNode = new Node(maxSuffix.length + 2, null, this.nodes.length);

            if (newNode.length === 1) {
                newNode.link = this.empty;
                newNode.palindrome = ch;
            } else {
                newNode.link = getMaxSuffixPalindrome(maxSuffix.link, ch).edges.get(ch);
                newNode.palindrome = ch + maxSuffix.palindrome + ch;
            }
            newNode.parent = maxSuffix;
            maxSuffix.edges.set(ch, newNode);
            this.nodes.push(newNode);
        }

        this.maxSuffix = maxSuffix.edges.get(ch);
        this.accumulated += ch;

        return createNewNode === true ? 1 : 0;
    }


}