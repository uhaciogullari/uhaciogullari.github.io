import {npcs} from "./data.js"
import {loadState, saveState} from "./state.js";

Vue.createApp({
    computed: {
        pickables() {
            return this.npcs.filter(
                (n) =>
                    n.dexterity <= this.dexterity &&
                    n.chapter <= this.chapter &&
                    (!this.filterPickpocketed ||
                        this.pickPocketState[n.id.toString()] !== true)
            );
        }
    },
    mounted() {
        let {dexterity, chapter, filterPickpocketed, pickpocketState} = loadState();
        this.dexterity = dexterity;
        this.chapter = chapter;
        this.filterPickpocketed = filterPickpocketed;
        this.pickPocketState = pickpocketState;
    },
    watch: {
        dexterity() {
            this.save();
        },
        chapter() {
            this.save();
        },
        filterPickpocketed() {
            this.save();
        }
    },
    methods: {
        isPickPocketed(id) {
            return this.pickPocketState[id.toString()] === true;
        },
        markPickPocketed(id, value) {
            this.pickPocketState[id.toString()] = value;
            this.save();
        },
        reset() {
            this.pickPocketState = {};
            this.save();
        },
        save() {
            console.log(this.filterPickpocketed);
            saveState(this.dexterity, this.chapter, this.filterPickpocketed, this.pickPocketState)
        }
    },
    data() {
        return {
            dexterity: 10,
            chapter: 1,
            filterPickpocketed: false,
            pickPocketState: {},
            npcs: npcs
        };
    }
}).mount("#app");