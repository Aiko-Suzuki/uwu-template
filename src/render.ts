// deno-lint-ignore-file no-explicit-any no-cond-assign ban-unused-ignore no-fallthrough
import { item, block } from "./interface.ts";
import { parse } from "./parser.ts";

const ESCAPE_REGEX = /[&<>'"]/g;

const helpers: Record<string, any> = {};

function registerHelper(name: string, fn: any) {
	helpers[name] = fn;
}

const entity: { [char: string]: string } = {
	"&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#x27;",
    "`": "&#x60;"
};

function escape(text: string): string {
	let result = "";
	let text_left = text;
	let m;
	while ((m = ESCAPE_REGEX.exec(text_left))) {
		result += text_left.slice(0, m.index) + entity[m[0]];
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
	private current_data: any;
	private render_cache: Record<string, any> = {};

	constructor(public template: string | item, options = COMPILE_OPTIONS) {
		this.options = options;
		this.compiled = typeof template == "string" ? parse(template) : template;
	}

	private getData(fn: any) {
		let data;
		if (typeof fn == "function") {
			try {
				return fn.apply(this.current_data ?? this.data);
			} catch (_e) {
				return fn.apply(this.data);
			}
		}

		return data;
	}

	private stringCache = (item: any) => {
		const name = item.var as string;

		return (this.render_cache[name] = helpers[item.helper]
			? () => helpers[item.helper](this.getData(item?.fn))
			: () => {
					const val = name == "this" ? this.current_data || this.data : this.getData(item?.fn);

					return this.options.escape && typeof val == "string" ? escape(val) : val;
			  });
	};

	private renderString = (item: item) => {
		return this.render_cache[item.var as string]?.() ?? this.stringCache(item)();
	};

	private renderBlock = (block: block) => {
		// generate unique key for condition
		switch (block.block_start) {
			case "if": {
				for (let index = 0; index < block.block_content.length; index++) {
					const item = block.block_content[index];
					switch (item.condition) {
						case undefined:
							return this.render(item.content);
						default:
							if (this.getData(item.condition)) {
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
	};

	private renderForeach = (block: block) => {
		let result = "";
		const old_data = this.current_data;

		const isThis = block.block_value == "this";
		const value = isThis ? this.data : this.getData(block?.fn);
		if (!Array.isArray(value)) throw new Error("each value is not an array");
		for (const key in value) {
			if (isThis) {
				this.current_data = value[key]
			} else {
				this.current_data = Object.assign({},old_data,typeof value[key] != "object" ? { [block.block_value.split(".").pop() as string] : value[key] } : value[key]);
			}
			result += this.render(block.block_content);
		}

		this.current_data = old_data;
		return result;
	};

	private render = (tree: item) => {
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
	};

	public start = (data: any) => {
		this.data = data;
		return this.render(this.compiled);
	};
}

function compile(template: string, options = COMPILE_OPTIONS) {
	const compiled = new renderObject(template, options);
	return compiled.start;
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
