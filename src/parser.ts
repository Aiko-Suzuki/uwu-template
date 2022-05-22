import { item, block } from "./interface.ts";

const item_reg = /\{!(.*?)\}/g;
const block_reg = /{#(?<block_start>.*?) (?<block_value>.*?)}(?<block_content>.*?)(?:{else}(?<block_content_2>.*?))?{\/\k<block_start>}/gms;

function parseString(template: string) {
	// use item_reg to find all {!xxx}
	const items: item[] = [];
	let template_left = template;
	let m;
	let true_index = 0;
	while ((m = item_reg.exec(template_left)) != null) {
		if (!m) break;
		const start = m.index;
		const end = m.index + m[0].length;
		const item = {
			type: "var",
			content: m[0],
			var: m[1],
			index: start,
			index_end: true_index + end,
		};
		const before = template_left.substring(0, item.index);
		if (item_reg.test(before)) {
			items.push({
				title: "before_block",
				content: parseString(before),
				type: "list",
				index: true_index,
				index_end: true_index + before.length,
			});
		} else {
			items.push({
				title: "before_block",
				content: before,
				type: "string",
				index: true_index,
				index_end: true_index + before.length,
			});
		}
		item.index = true_index + start;
		items.push(item as unknown as item);
		true_index = end + true_index;
		template_left = template_left.substring(end) || "";
	}

	items.sort((a, b) => (a.index as number) - (b.index as number));
	items.push({
		title: "before_block",
		content: template_left,
		type: "string",
		index: true_index,
		index_end: true_index + template_left?.length,
	});

	return items;
}

// parse the template
function parse(template: string) {
	const blocks: block[] = [];
	const items: item[] = [];

	let template_left = template;
	// parse block with the block_reg
	const match = template.matchAll(block_reg);
	for (const m of match) {
		const groups = m.groups;
		switch (groups?.block_start) {
			case "if": {
				blocks.push({
					block_start: groups.block_start,
					block_value: groups.block_value,
					block_content: parse(groups.block_content),
					block_content_2: groups.block_content_2 != undefined ? parse(groups.block_content_2) : "",
					index: m.index as number,
					index_end: (m.index as number) + m[0].length,
				});
				break;
			}
			case "foreach": {
				blocks.push({
					block_start: groups.block_start,
					block_value: groups.block_value,
					block_content: parse(groups.block_content + "{else}" + groups.block_content_2),
					index: m.index as number,
					index_end: (m.index as number) + m[0].length,
				});
			}
		}
	}

	for (let index = 0; index < blocks.length; index++) {
		const block = blocks[index];
		const before = template_left.substring(0, block.index);
		// parse the before string
		items.push({
			title: "before_var",
			content: parseString(before),
			type: "list",
		});
		// check if its a foreach block
		items.push({
			title: "block",
			content: block,
			type: block.block_start == "foreach" ? "foreach" : "block",
		});
		// check if its last block
		template_left = template_left.substring(block.index_end);
		if (index === blocks.length - 1) {
			items.push({
				title: "after_var",
				content: parseString(template_left),
				type: "list",
			});
		}
	}
	if (blocks.length === 0) {
		items.push({
			title: "content",
			content: parseString(template_left),
			type: "list",
		});
	}

	const root = {
		title: "list",
		childs: items,
		type: "item",
	};

	return root as item;
}

export { parse };
