import { item, block,block_inside } from "./interface.ts";

const ITEM_PARSING_REGEX = /\{{(.*?)}}/g;


const BLOCK_PARSING_REGEX = /{{\/(?<block_close>.*?)}}|{{#else}}|{{#(?<block_start>.*?) (?<block_value>.*?)}}/gms;



function parseString(template: string) {
	// use ITEM_PARSING_REGEX to find all {!xxx}
	const items: item[] = [];
	let template_left = template;
	let m;
	let true_index = 0;

	while ((m = ITEM_PARSING_REGEX.exec(template_left)) != null) {
		if (!m) break;
		const start = m.index;
		const end = m.index + m[0].length;
		const item = {
			type: "var",
			content: m[0],
			var: m[1],
            fn : new Function("data", "return this." + m[1]),
			index: start,
			index_end: true_index + end,
		};
		const before = template_left.substring(0, item.index);
		if (ITEM_PARSING_REGEX.test(before)) {
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

// type: lastype as block_inside["type"],
// content: parse(m.groups?.block_content ?? ""),
// condition:  lastcondition ? new Function("data", `return !!(${lastcondition})`) : undefined,
// str_condition : lastcondition


function parseIfBlock(template: string) {
    const blocks: block_inside[] = [];
    // get first if open using IF_OPEN
    const item_order:{
        index: number,
        length : number,
        type: string,
        condition?: string,
    }[] = [];
    let first_if:any;
    let temp_block:{
        index: number,
        length : number,
        type: string,
        condition?: string,
    }[]|any = [];

    function addItem(type:string,m:any){
        const start = m.index;
        const item = {
            index: start as number,
            length: m[0].length,
            type: type,
            condition: m.groups?.block_value,
        };
        item_order.push(item);
    }
    
    const open_if = template.matchAll(new RegExp(BLOCK_PARSING_REGEX, "g"));
    for (const m of open_if) {
        const type = m.groups?.block_start ? m.groups?.block_start : m.groups?.block_close ? "ifclose" : "else";

        switch (type) {
            case "if":
                if (!first_if) {
                    first_if = m;
                    addItem(type,m);
                } else {
                    temp_block.push(m)
                }
                break;
            case "elseif":
                if (temp_block.length == 0) {
                    addItem(type,m);
                }
                break;
            case "else":
                if (temp_block.length == 0) {
                    addItem(type,m);
                }
                break;
            case "ifclose":
                if (temp_block.length == 0) {
                    addItem(type,m);
                } else {
                    temp_block.pop();
                }
                break;
            default:
                break;
        }
    }


    item_order.sort((a, b) => (a.index as number) - (b.index as number));

    if (item_order.length == 2 && item_order[0].type == "if" && item_order[1].type == "ifclose") {
        const content = template.substring(item_order[0].index + item_order[0].length, item_order[1].index).trim();
        blocks.push({
            type: "if",
            condition: new Function("data", `return !!(${item_order[0].condition})`) ?? undefined,
            content: parse(content),
            str_condition: item_order[0].condition,
        });
        return blocks;
    }

    temp_block = [];
    // match opening if with matching closing if
    for (const item of item_order) {
        switch (item.type) {
            case "if":
                if (temp_block.length == 0) {
                    temp_block.push(item);
                }
                break;
            case "elseif":
                // check if theres on open if
                if (temp_block.length == 1) {
                    const lastitem = temp_block.pop();
                    if (lastitem) {
                        const content = template.substring(lastitem.index + lastitem.length, item.index).trim();
                        blocks.push({
                            type: lastitem.type as block_inside["type"],
                            condition: new Function("data", `return !!(${lastitem.condition})`) ?? undefined,
                            content: parse(content),
                            str_condition: lastitem.condition,
                        });
                    }
                }
                temp_block.push(item);
                break;
            case "else":
                // check if theres on open if
                if (temp_block.length == 1) {
                    const lastitem = temp_block.pop();
                    if (lastitem) {
                        const content = template.substring(lastitem.index + lastitem.length, item.index).trim();
                        blocks.push({
                            type: lastitem.type as block_inside["type"],
                            condition: lastitem.condition ? new Function("data", `return !!(${lastitem.condition})`) : undefined,
                            content: parse(content),
                            str_condition: lastitem.condition,
                        });
                    }
                    temp_block.push(item);
                }
                break;
            case "ifclose":
                // check if if is inside another if block or not
                // check if last if
                if (temp_block.length == 1){
                    const lastitem = temp_block.pop();
                    if (lastitem) {
                        const content = lastitem.type == "if" ? template.substring(lastitem.index + lastitem.length, item.index + item.length) : template.substring(lastitem.index + lastitem.length, item.index).trim();
                        blocks.push({
                            type: lastitem.type as block_inside["type"],
                            condition: lastitem.condition ? new Function("data", `return !!(${lastitem.condition})`) : undefined,
                            content: parse(content),
                            str_condition: lastitem.condition,
                        });
                    }
                }
                break;
            default:

                break;
        }
    }

    return blocks;
}

// parse the template
function parse(template: string) {
	const blocks: block[] = [];
	const items: item[] = [];

	let template_left = template;
	// parse block with the BLOCK_PARSING_REGEX
	const match = template.matchAll(new RegExp(BLOCK_PARSING_REGEX, "g"));
    let first_block;
    let closing_block;
    let temp_block:any[] = [];

    // find matching opening and closing block && ignore nested blocks
	for (const m of match) {
        const groups = m.groups;
        if (groups?.block_start && !first_block) {
            first_block = m;
            continue;
        }

        if (groups?.block_start && groups?.block_start !== "elseif" ) {
            temp_block.push(m);
            continue;
        }


        if (groups?.block_close && temp_block.length > 0) {
            temp_block.pop();
            continue;
        }

        if (groups?.block_close && first_block && temp_block.length == 0) {
            closing_block = m;
            continue;
        }
		
	}

    if (first_block && closing_block) {
        switch (first_block.groups?.block_start) {
            case "if": {
                const content = template.substring(first_block?.index as number, closing_block?.index as number + closing_block.length + first_block?.length)
				blocks.push({
					block_start: first_block.groups?.block_start,
					block_value: first_block.groups?.block_startblock_value,
					block_content:  parseIfBlock(content),
					index: first_block?.index as number,
					index_end: closing_block?.index as number + closing_block.length + first_block?.length,
				});
				break;
			}
			case "each": {
                const content = template.substring(first_block?.index as number + first_block[0].length , closing_block.index);
                blocks.push({
					block_start: first_block.groups?.block_start,
					block_value: first_block.groups?.block_value,
					block_content:  parse(content),
					index: first_block?.index as number,
					index_end: (closing_block.index as number) + closing_block?.length+ first_block[0].length ,
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
			type: block.block_start == "each" ? "each" : "block",
		});
		// check if its last block
		template_left = template_left.substring(block.index_end - 1);
        if (BLOCK_PARSING_REGEX.test(template_left)) {
            items.push({
                title: "block",
                content: parse(template_left),
                type: "item",
            });
            continue;
        }
		if (index === blocks.length - 1) {
            // check if string contains only whitespace
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
		type: "items",
	};

	return root as item;
}

export { parse };
