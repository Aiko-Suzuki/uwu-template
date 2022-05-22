// deno-lint-ignore-file no-explicit-any
import { item, block } from "./interface.ts";
import { parse } from "./parser.ts";

const helpers:Record<string,any> = {
    formatdate: (date: string) => {
        const d = new Date(date);
        const h = d.getUTCHours();
        const m = d.getUTCMinutes();
        const y = d.getUTCFullYear();
        const M = d.getUTCMonth() + 1;
        const D = d.getUTCDate();
        return `${h < 10 ? "0" + h : h}:${m < 10 ? "0" + m : m} ${y}-${M < 10 ? "0" + M : M}-${D < 10 ? "0" + D : D}`;
    }
}

function renderString(item: item, data: any) {
	// check for action
    // const var_ = item.var as string;
    // const split = var_.split(" ");
    // const action = split[0];
    // const var_name = split[1];

	return  data[item.var as string];
}
function renderBlock(block: block, data: any) {
	const condition_type = block.block_start;

	switch (condition_type) {
		case "if": {
			const result = new Function("data", "return " + block.block_value).apply(data) ? block.block_content : block.block_content_2;
			return render(result.childs?.[0] || "", data);
		}
		default:
			throw new Error("Unknown block type: " + condition_type);
	}
}
// compile foreach return a function that can used to render a item

function renderForeach(block: block, data: any) {
	const childs = block.block_content.childs;
	const value = block.block_value == "this" ? data : data[block.block_value];

	if (!value) return "";
	let result = "";

	for (const item of value) {
		const ch = [...childs];
		while (ch.length) {
			const child = ch.shift();
			result += render(child, item);
		}
	}

	return result;
}

function render(tree: item, data: any) {
	let html = "";
	switch (tree.type) {
		case "block":
			html += renderBlock(tree.content, data);
			break;
		case "foreach":
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

export { renderTemplate, compile };