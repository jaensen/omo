//
// Elements
//
import Compositor from "./blocks/Compositor.svelte";
import OmoBanner from "./blocks/molecules/OmoBanner.svelte";
import OmoNav from "./blocks/molecules/OmoNav.svelte";
export class Registrar {
    constructor() {
        this.molecules = new Map();
        this.actions = new Map();
        this.molecules.set("OmoBanner", OmoBanner);
        this.molecules.set("OmoNav", OmoNav);
        this.molecules.set("Compositor", Compositor);
        this.actions.set("test", () => alert("test!"));
    }
}
//# sourceMappingURL=ComponentRegistrar.js.map