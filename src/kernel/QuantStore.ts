import { Query } from "@textile/threads-client";
import QuantListener from "./QuantListener";
import CodeEditor from "./quants/CodeEditor";
import DragableQuant from "./quants/DragableQuant";
import Editor from "./quants/Editor";

export class QuantStore {


    public get QuantStoreId(): string { return "af8fd66c-3cbd-49b9-abbc-2811dc870388" }

    get all(): any {
        throw new Error("Method not implemented.");
    }
    private get quantaSchema(): any {
        return {
            "$id": "https://example.com/person.schema.json",
            "$schema": "http://json-schema.org/draft-07/schema#",
            "properties": {
                "author": {
                    "type": "string"
                },
                "code": {
                    "type": "string"
                },
                "name": {
                    "type": "string"
                },
                "project": {
                    "type": "string"
                }
            },
            "title": "quanta",
            "type": "object",
        };
    }
    private get versionSchema(): any {
        return {
            "$id": "https://example.com/person.schema.json",
            "$schema": "http://json-schema.org/draft-07/schema#",
            "properties": {
                "code": {
                    "type": "string"
                },
                "major": {
                    "type": "string"
                },
                "minor": {
                    "type": "string"
                },
                "patch": {
                    "type": "string"
                },
                "quant": {
                    "type": "string"
                }
            },
            "title": "quanta",
            "type": "object",
        };
    }
    public quanta: any;
    private listener: QuantListener;

    public register($class: any, author: string, project: string, name: string, major: number, minor: number, patch: number): void {
        this.storeQuant(author, project, name, $class, major, minor, patch);
    }

    public get(author: string, project: string, name: string, major: number, minor: number, patch: number): any {
        console.log("BREAKK")
        const version = this.getVersion(author, project, name, major, minor, patch);
        if (typeof (this.quanta[author][project][name][version]) === "function") {
            return this.quanta[author][project][name][version];
        }
        throw Error("Quant not loaded");
    }

    public async loadFromThreadByName(name: string): Promise<string> {
        const meta = this.listener.getMeta(name);
        return this.loadFromThread(meta.author, meta.project, meta.name, meta.number, meta.minor, meta.patch);
    }

    public async loadFromThread(author: string, project: string, name: string, major: number, minor: number, patch: number): Promise<string> {
        const query = new Query();
        this.andFilter(query, "author", author);
        this.andFilter(query, "project", project);
        this.andFilter(query, "name", name);

        const result = await omo.client.modelFind(this.QuantStoreId, await this.QuantModelName(), query);
        if (result.entitiesList.length > 1) {
            throw Error("Something went totally wrong");
        }

        if (result.entitiesList.length === 0) {
            throw Error("Quant is not in our database");
        }

        console.log("TODO load version", major, minor, patch);

        const quant = result.entitiesList[0];
        const response = await omo.ipfs.cat(quant.code);
        return response.toString();
    }

    public async QuantModelName(): Promise<string> {
        // const hashJsonSchemaResult = await window.omo.ipfs.add(this.quantaSchema, { onlyHash: true });
        // return hashJsonSchemaResult[0].hash;
        return "quant";
    }

    public async initAsync(): Promise<void> {
        try {
            await omo.client.registerSchema(this.QuantStoreId, await this.QuantModelName(), this.quantaSchema);
            await omo.client.registerSchema(this.QuantStoreId, "version", this.versionSchema);
        }
        catch (err) { if (err.message !== 'already registered model') { throw err; } }
        this.storeQuant("omo", "quantum", "quant", DragableQuant, 0, 1, 0);
        this.storeQuant("omo", "quantum", "editor", Editor, 0, 1, 0);
        this.storeQuant("omo", "quantum", "codeEditor", CodeEditor, 0, 1, 0);
        // this.CreateOrUpdateQuant("omo", "quantum", "simple", "QmYWVoFsaCwVo2KVHTbskRn7KBs9PxvF68Zv1tPiocBdEm");
        this.listener = new QuantListener();
        console.log(this.listener);
    }
    public async saveQuant(quant: string, code: string): Promise<void> {
        await omo.ipfs.files.rm(`/quanta/${quant}`);
        await omo.ipfs.files.write(`/quanta/${quant}`, code, { create: true });
        const hash = (await omo.ipfs.files.stat("/quanta/omo-quantum-simple-0.1.0")).hash;
        const meta = this.listener.getMeta(quant);
        await this.CreateOrUpdateQuant(meta.author, meta.project, meta.name, hash);
    }
    public async CreateOrUpdateQuant(author: string, project: string, name: string, codeCid: string): Promise<any> {
        const query = new Query();
        this.andFilter(query, "author", author);
        this.andFilter(query, "project", project);
        this.andFilter(query, "name", name);

        const result = await omo.client.modelFind(this.QuantStoreId, await this.QuantModelName(), query);
        if (result.entitiesList.length > 1) {
            throw Error("Something went totally wrong");
        }
        let model = {};
        if (result.entitiesList.length === 1) {
            model = result.entitiesList[0];
            model["code"] = codeCid;
            await omo.client.modelSave(this.QuantStoreId, await this.QuantModelName(), [model]);
        }
        else {
            model = {};
            model["author"] = author;
            model["project"] = project;
            model["name"] = name;
            model["code"] = codeCid;
            await omo.client.modelCreate(this.QuantStoreId, await this.QuantModelName(), [model]);
        }
        return model;
    }

    public storeQuant(author: string, project: string, name: string, constructor: any, major: number, minor: number, patch: number): void {
        const version = this.getVersion(author, project, name, major, minor, patch);
        this.quanta[author][project][name][version] = constructor;
        const quantName = `${author.toLowerCase()}-${project.toCamelCase()}-${name.toLowerCase()}-${version}`;
        window.customElements.define(quantName, constructor);
    }

    private andFilter(query: Query, property: string, value: string): void {
        const criterion = query.and(property);
        criterion.value = { string: value };
        query.ands.push(criterion);
    }


    private getVersion(author: string, project: string, name: string, major: number, minor: number, patch: number): string {
        if (!this.quanta) {
            this.quanta = {};
        }
        if (!this.quanta[author]) {
            this.quanta[author] = {};
        }
        if (!this.quanta[author][project]) {
            this.quanta[author][project] = {};
        }
        if (!this.quanta[author][project][name]) {
            this.quanta[author][project][name] = {};
        }
        const version = `${major ? major : 0}.${minor ? minor : 0}.${patch ? patch : 0}`;
        if (!this.quanta[author][project][name][version]) {
            this.quanta[author][project][name][version] = {};
        }
        return version;
    }
}