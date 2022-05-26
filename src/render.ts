// deno-lint-ignore-file no-explicit-any no-cond-assign ban-unused-ignore no-fallthrough
import { item, block } from "./interface.ts";
import { parse } from "./parser.ts";

const ESCAPE_REGEX = /[&<>'"]/g;

const helpers: Record<string, any> = {};

function registerHelper(name: string, fn: any) {
	helpers[name] = fn;
}

const entity: { [char: string]: string } = {
	"<": "&lt;",
	">": "&gt;",
	"&": "&amp;",
	"'": "&#39;",
	'"': "&#34;",
};

function escape(text: string): string {
    let result = "";
    let text_left = text;
    let m;
    while ((m = ESCAPE_REGEX.exec(text_left))) {
        result += text_left.slice(0, m.index);
        result += entity[m[0]];
        text_left = text_left.slice(m.index + 1);
    }
    return result + text_left;
}

const COMPILE_OPTIONS = {
	escape: true,
};

class renderObject {
	public options = COMPILE_OPTIONS;
	public compiled: any;
	private data: any;
	private render_cache: Record<string, any> = {};

	constructor(public template: string | item, options = COMPILE_OPTIONS) {
		this.options = options;
		this.compiled = typeof template == "string" ? parse(template) : template;
	}
	private stringCache(item:any) {
        const name = item.var as string;
		const split = name.split(" "),
			action = split[0],
			key = split[1];
        // check if contains dot


		return this.render_cache[name] = helpers[action]
			? () => helpers[action](this.data[key])
            : () => {
                const val = name == "this" ? this.data : item?.fn.apply(this.data);
                if (this.options.escape ) {
                    return typeof val == "string" ? escape(val) : val;
                }
                return val;
            };
	}

	private renderString(item: item) {
		return this.render_cache[item.var as string]?.() ?? this.stringCache(item)();
	}

	private renderBlock(block: block) {
		// generate unique key for condition
		switch (block.block_start) {
			case "if": {
				for (let index = 0; index < block.block_content.length; index++) {
					const item = block.block_content[index];
					switch (item.condition) {
						case undefined:
							return this.render(item.content);
						default:
							if (item.condition.apply(this.data)) {
								return this.render(item.content);
							}
							break;
					}
				}
                return "";
			}
			default:
				throw new Error("Unknown block type: " + block.block_start);
		}
	}

	private renderForeach(block: block) {
		let result = "";
		const old_data = this.data;

		const value = block.block_value == "this" ? this.data : this.data[block.block_value];

		for (let vindex = 0; vindex < value.length; vindex++) {
			this.data = value[vindex];
			result += this.render(block.block_content);
		}
		this.data = old_data;
		return result;
	}

	private render(tree: item) {
		let html = "";
		switch (tree.type) {
			case "block":
				html += this.renderBlock(tree.content);
				break;
			case "each":
				html += this.renderForeach(tree.content);
				break;
			case "string":
				html += tree.content;
				break;
			case "var":
				html += this.renderString(tree);
				break;
			case "list":
				for (const item of tree.content) {
					html += this.render(item);
				}
				break;
			case "items":
				for (const item of tree.childs as item[]) {
					html += this.render(item);
				}
				break;
            case "item":
                html += this.render(tree.content);
                break;

			default:
				html += tree.content;
				break;
		}

		return html;
	}

	public start(data: any) {
		this.data = data;
		return this.render(this.compiled);
	}
}

function compile(template: string, options = COMPILE_OPTIONS) {
	const compiled = new renderObject(template, options);
	return compiled.start.bind(compiled);
}

const compiled_list = new Map<string, any>();

function renderTemplate(key: string, data: any, template: string) {
	if (compiled_list.has(key)) {
		return compiled_list.get(key)(data);
	}
	const compiled = compile(template);
	compiled_list.set(key, compiled);
	return compiled(data);
}

registerHelper("JSON", (data: any) => {
	return JSON.stringify(data);
});

registerHelper("raw", (data: any) => {
	return data;
});

export { renderTemplate, compile, registerHelper };
