// deno-lint-ignore-file no-explicit-any no-cond-assign ban-unused-ignore no-fallthrough
import { item, block } from "./interface.ts";
import { parse } from "./parser.ts";

const helpers: Record<string, any> = {};

function registerHelper(name: string, fn: any) {
	helpers[name] = fn;
}

function escape(text: string): string {
	const entity: { [char: string]: string } = {
		"<": "&lt;",
		">": "&gt;",
		"&": "&amp;",
		"'": "&#39;",
		'"': "&#34;",
	};
	return text.replaceAll(/[&<>"']/g, (char) => {
		return entity[char];
	});
}
const render_cache: Record<string, any> = {};

const ss = (name: string) => {
	const split = name.split(" "),
		action = split[0],
        key = split[1],
        helper = helpers[action];
	render_cache[name] = helper ? (data: any) => helper(data[key]) : (data: any) => data[name];
};

function renderString(item: item, data: any) {
	let result = "";
	render_cache[item.var as string] ? (result = render_cache[item.var as string](data)) : ss(item.var as string);
	return result;
}

function renderBlock(block: block, data: any) {
	// generate unique key for condition
	switch (block.block_start) {
		case "if": {
			let i = 0;
			let child;
			while ((child = block.block_content[i++])) {
				switch (child.condition && child.condition.apply(data)) {
					case true:
						return render(child.content, data);
				}
			}
			break;
		}
		default:
			throw new Error("Unknown block type: " + block.block_start);
	}
}

function renderForeach(block: block, data: any) {
	const value = block.block_value == "this" ? data : data[block.block_value];
	let result = "";

	let i = 0,
		e = 0;
	let item, child;
	while ((item = value[i++])) {
		while ((child = block.block_content.childs[e++])) {
			result += render(child, item);
		}
		e = 0;
	}
	return result;
}

function render(tree: item, data: any) {
	let html = "";
	switch (tree.type) {
		case "block":
			html += renderBlock(tree.content, data);
			break;
		case "each":
			if (data.length == 0) break;
			html += renderForeach(tree.content, data);
			break;
		case "string":
			html += tree.content;
			break;
		case "var":
			html += renderString(tree, data);
			break;
		case "list":
			for (const item of tree.content) {
				html += render(item, data);
			}
			break;
		case "item":
			for (const item of tree.childs as item[]) {
				html += render(item, data);
			}
			break;
		default:
			html += tree.content;
			break;
	}

	return html;
}

function compile(template: string) {
	const tree = parse(template);
	const compiled = function (data: any) {
		let result = "";
		for (const item of tree.childs as item[]) {
			result += render(item, data);
		}
		return result;
	};
	return compiled;
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

registerHelper("escape", (data: any) => {
	return escape(data.toString());
});

export { renderTemplate, compile, registerHelper };
