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
    // replace using while loop and ESCAPE_REGEX
    let result = text;
    let m;
    while ((m = ESCAPE_REGEX.exec(text))) {
        result = result.substring(0, m.index) + entity[m[0]] + result.substring(m.index + m[0].length);  
    }

    return result;
}
const render_cache: Record<string, any> = {};

const ss = (name: string,data:any) => {
	const split = name.split(" "),
		action = split[0],
		key = split[1],
		helper = helpers[action];
	render_cache[name] = helper ? (data: any) => helper(data[key]) : (data: any) => typeof data[name] == "string" ? escape(data[name]) : data[name];
    return render_cache[name](data);
};

function renderString(item: item, data: any) {
	return render_cache[item.var as string]?.(data) ?? ss(item.var as string,data);
}

function renderBlock(block: block, data: any) {
	// generate unique key for condition
	switch (block.block_start) {
		case "if": {
            let i = 0;
            const child_len = block.block_content.length;
			while (i < child_len) {
				switch (block.block_content[i].condition) {
					case undefined:
						return render(block.block_content[i].content, data);
					default:
						switch (block.block_content[i].condition.apply(data)) {
							case true:
								return render(block.block_content[i].content, data);
						}
						break;
				}
                i++;
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
    const value_len = value.length,
		child_len = block.block_content.childs.length;

	while (i < value_len) {
		while (e < child_len) {
			result += render(block.block_content.childs[e++],value[i]);
		}
		e = 0;
        i++
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

registerHelper("raw", (data: any) => {
	return data;
});

export { renderTemplate, compile, registerHelper };
