// deno-lint-ignore-file no-explicit-any
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

function renderString(item: item, data: any) {
	//check for action
	const var_ = item.var as string;
	if (!render_cache[var_]) {
		const split = var_.split(" ");
		const action = split[0];
		const var_name = split[1];
		const fn = helpers[action] ? (data: any) => helpers[action](data[var_name]) : (data: any) =>  data[var_];
		render_cache[var_] = fn;
	}
	return render_cache[var_](data);
}
function renderBlock(block: block, data: any) {
	const condition_type = block.block_start;

	switch (condition_type) {
		case "if": {
			let found = false;
            const childs = block.block_content;
            while (childs.length !== 0) {
                const child = childs.shift();
                if (child.condition) found = child.condition.apply(data);

                if (found) return render(child.content, data);

                // check if last child
                if (childs.length === 0) {
                    if (!child.condition) {
                        return render(child.content, data);
                    }
                }


            }
			break;
		}
		default:
			throw new Error("Unknown block type: " + condition_type);
	}
}

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
		case "each":
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
    Deno.writeTextFileSync("./tree.json", JSON.stringify(tree, null, 2));
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

registerHelper("json", (data: any) => {
	return JSON.stringify(data);
});

registerHelper("escape", (data: any) => {
	return escape(data.toString());
});


export { renderTemplate, compile, registerHelper };
