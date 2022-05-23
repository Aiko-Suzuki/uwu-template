// deno-fmt-ignore-file
// deno-lint-ignore-file
// This code was bundled using `deno bundle` and it's not recommended to edit it manually

const ITEM_PARSING_REGEX = /\{{(.*?)}}/g;
const BLOCK_PARSING_REGEX = /{{#(?<block_start>.*?) (?<block_value>.*?)}}(?<block_content>.*?){{\/\k<block_start>}}/gms;
const BLOCK_INSIDE_REGEX = /(?:{{(?<block_start>.*?)(?: (?<block_value>.*?))}})?(?<block_content>.*?)?{{(?:(?<block_next>.*?|\/.*?))}}/gms;
function parseString(template) {
    const items = [];
    let template_left = template;
    let m;
    let true_index = 0;
    while((m = ITEM_PARSING_REGEX.exec(template_left)) != null){
        if (!m) break;
        const start = m.index;
        const end = m.index + m[0].length;
        const item = {
            type: "var",
            content: m[0],
            var: m[1],
            index: start,
            index_end: true_index + end
        };
        const before = template_left.substring(0, item.index);
        if (ITEM_PARSING_REGEX.test(before)) {
            items.push({
                title: "before_block",
                content: parseString(before),
                type: "list",
                index: true_index,
                index_end: true_index + before.length
            });
        } else {
            items.push({
                title: "before_block",
                content: before,
                type: "string",
                index: true_index,
                index_end: true_index + before.length
            });
        }
        item.index = true_index + start;
        items.push(item);
        true_index = end + true_index;
        template_left = template_left.substring(end) || "";
    }
    items.sort((a, b)=>a.index - b.index
    );
    items.push({
        title: "before_block",
        content: template_left,
        type: "string",
        index: true_index,
        index_end: true_index + template_left?.length
    });
    return items;
}
function parseBlock(template) {
    const blocks = [];
    let m;
    let gtype = false;
    let lastype = "";
    let lastcondition = "";
    while((m = BLOCK_INSIDE_REGEX.exec(template)) !== null){
        if (!m) break;
        lastype = m.groups?.block_start ? m.groups?.block_start.replace("#", "") : undefined ?? lastype;
        lastcondition = m.groups?.block_value ?? lastcondition;
        if (!gtype) gtype = m.groups?.block_start.replace("#", "") ?? false;
        const block = {
            type: lastype,
            content: parse(m.groups?.block_content ?? ""),
            condition: lastcondition ? new Function("data", `return ${lastcondition}`) : undefined,
            str_condition: lastcondition
        };
        blocks.push(block);
        const split = m.groups?.block_next?.split(" ") ?? [];
        lastype = split[1] ? split[0].replace("#", "") : split[0] || "";
        lastcondition = split.slice(1).join(" ") || "";
    }
    return blocks;
}
function parse(template) {
    const blocks = [];
    const items = [];
    let template_left = template;
    const match = template.matchAll(BLOCK_PARSING_REGEX);
    for (const m of match){
        const groups = m.groups;
        switch(groups?.block_start){
            case "if":
                {
                    blocks.push({
                        block_start: groups.block_start,
                        block_value: groups.block_value,
                        block_content: parseBlock(m[0]),
                        index: m.index,
                        index_end: m.index + m[0].length
                    });
                    break;
                }
            case "each":
                {
                    blocks.push({
                        block_start: groups.block_start,
                        block_value: groups.block_value,
                        block_content: parse(groups.block_content),
                        index: m.index,
                        index_end: m.index + m[0].length
                    });
                }
        }
    }
    for(let index = 0; index < blocks.length; index++){
        const block = blocks[index];
        const before = template_left.substring(0, block.index);
        items.push({
            title: "before_var",
            content: parseString(before),
            type: "list"
        });
        items.push({
            title: "block",
            content: block,
            type: block.block_start == "each" ? "each" : "block"
        });
        template_left = template_left.substring(block.index_end);
        if (index === blocks.length - 1) {
            items.push({
                title: "after_var",
                content: parseString(template_left),
                type: "list"
            });
        }
    }
    if (blocks.length === 0) {
        items.push({
            title: "content",
            content: parseString(template_left),
            type: "list"
        });
    }
    const root = {
        title: "list",
        childs: items,
        type: "item"
    };
    return root;
}
const helpers = {};
function registerHelper(name, fn) {
    helpers[name] = fn;
}
function escape(text) {
    const entity = {
        "<": "&lt;",
        ">": "&gt;",
        "&": "&amp;",
        "'": "&#39;",
        '"': "&#34;"
    };
    return text.replaceAll(/[&<>"']/g, (__char)=>{
        return entity[__char];
    });
}
const render_cache = {};
function renderString(item, data1) {
    const var_ = item.var;
    if (!render_cache[var_]) {
        const split = var_.split(" ");
        const action = split[0];
        const var_name = split[1];
        const fn = helpers[action] ? (data)=>helpers[action](data[var_name])
         : (data)=>data[var_]
        ;
        render_cache[var_] = fn;
    }
    return render_cache[var_](data1);
}
function renderBlock(block, data) {
    const condition_type = block.block_start;
    switch(condition_type){
        case "if":
            {
                let found = false;
                const childs = block.block_content;
                while(childs.length !== 0){
                    const child = childs.shift();
                    if (child.condition) found = child.condition.apply(data);
                    if (found) return render(child.content, data);
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
function renderForeach(block, data) {
    const childs = block.block_content.childs;
    const value = block.block_value == "this" ? data : data[block.block_value];
    if (!value) return "";
    let result = "";
    for (const item of value){
        const ch = [
            ...childs
        ];
        while(ch.length){
            const child = ch.shift();
            result += render(child, item);
        }
    }
    return result;
}
function render(tree, data) {
    let html = "";
    switch(tree.type){
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
            for (const item of tree.content){
                html += render(item, data);
            }
            break;
        case "item":
            for (const item1 of tree.childs){
                html += render(item1, data);
            }
            break;
        default:
            html += tree.content;
            break;
    }
    return html;
}
function compile(template) {
    const tree = parse(template);
    const compiled = function(data) {
        let result = "";
        for (const item of tree.childs){
            result += render(item, data);
        }
        return result;
    };
    return compiled;
}
const compiled_list = new Map();
function renderTemplate(key, data, template) {
    if (compiled_list.has(key)) {
        return compiled_list.get(key)(data);
    }
    const compiled = compile(template);
    compiled_list.set(key, compiled);
    return compiled(data);
}
registerHelper("json", (data)=>{
    return JSON.stringify(data);
});
registerHelper("escape", (data)=>{
    return escape(data.toString());
});
export { renderTemplate as renderTemplate, compile as compile, registerHelper as registerHelper };
