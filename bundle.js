// deno-fmt-ignore-file
// deno-lint-ignore-file
// This code was bundled using `deno bundle` and it's not recommended to edit it manually

const ITEM_PARSING_REGEX = /\{{(.*?)}}/g;
const BLOCK_PARSING_REGEX = /{{\/(?<block_close>.*?)}}|{{#else}}|{{#(?<block_start>.*?) (?<block_value>.*?)}}/gms;
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
function parseIfBlock(template) {
    const blocks = [];
    const item_order = [];
    let first_if;
    let temp_block = [];
    function addItem(type, m) {
        const start = m.index;
        const item = {
            index: start,
            length: m[0].length,
            type: type,
            condition: m.groups?.block_value
        };
        item_order.push(item);
    }
    const open_if = template.matchAll(new RegExp(BLOCK_PARSING_REGEX, "g"));
    for (const m1 of open_if){
        const type = m1.groups?.block_start ? m1.groups?.block_start : m1.groups?.block_close ? "ifclose" : "else";
        switch(type){
            case "if":
                if (!first_if) {
                    first_if = m1;
                    addItem(type, m1);
                } else {
                    temp_block.push(m1);
                }
                break;
            case "elseif":
                if (temp_block.length == 0) {
                    addItem(type, m1);
                }
                break;
            case "else":
                if (temp_block.length == 0) {
                    addItem(type, m1);
                }
                break;
            case "ifclose":
                if (temp_block.length == 0) {
                    addItem(type, m1);
                } else {
                    temp_block.pop();
                }
                break;
            default:
                break;
        }
    }
    item_order.sort((a, b)=>a.index - b.index
    );
    if (item_order.length == 2 && item_order[0].type == "if" && item_order[1].type == "ifclose") {
        const content = template.substring(item_order[0].index + item_order[0].length, item_order[1].index).trim();
        blocks.push({
            type: "if",
            condition: new Function("data", `return !!(${item_order[0].condition})`) ?? undefined,
            content: parse(content),
            str_condition: item_order[0].condition
        });
        return blocks;
    }
    temp_block = [];
    for (const item1 of item_order){
        switch(item1.type){
            case "if":
                if (temp_block.length == 0) {
                    temp_block.push(item1);
                }
                break;
            case "elseif":
                if (temp_block.length == 1) {
                    const lastitem = temp_block.pop();
                    if (lastitem) {
                        const content = template.substring(lastitem.index + lastitem.length, item1.index).trim();
                        blocks.push({
                            type: lastitem.type,
                            condition: new Function("data", `return !!(${lastitem.condition})`) ?? undefined,
                            content: parse(content),
                            str_condition: lastitem.condition
                        });
                    }
                }
                temp_block.push(item1);
                break;
            case "else":
                if (temp_block.length == 1) {
                    const lastitem = temp_block.pop();
                    if (lastitem) {
                        const content = template.substring(lastitem.index + lastitem.length, item1.index).trim();
                        blocks.push({
                            type: lastitem.type,
                            condition: lastitem.condition ? new Function("data", `return !!(${lastitem.condition})`) : undefined,
                            content: parse(content),
                            str_condition: lastitem.condition
                        });
                    }
                    temp_block.push(item1);
                }
                break;
            case "ifclose":
                if (temp_block.length == 1) {
                    const lastitem = temp_block.pop();
                    if (lastitem) {
                        const content = lastitem.type == "if" ? template.substring(lastitem.index + lastitem.length, item1.index + item1.length) : template.substring(lastitem.index + lastitem.length, item1.index).trim();
                        blocks.push({
                            type: lastitem.type,
                            condition: lastitem.condition ? new Function("data", `return !!(${lastitem.condition})`) : undefined,
                            content: parse(content),
                            str_condition: lastitem.condition
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
function parse(template) {
    const blocks = [];
    const items = [];
    let template_left = template;
    const match = template.matchAll(new RegExp(BLOCK_PARSING_REGEX, "g"));
    let first_block;
    let closing_block;
    let temp_block = [];
    for (const m of match){
        const groups = m.groups;
        if (groups?.block_start && !first_block) {
            first_block = m;
            continue;
        }
        if (groups?.block_start && groups?.block_start !== "elseif") {
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
    console.log(first_block, closing_block);
    if (first_block && closing_block) {
        switch(first_block.groups?.block_start){
            case "if":
                {
                    const content = template.substring(first_block?.index, closing_block?.index + closing_block.length + first_block?.length);
                    blocks.push({
                        block_start: first_block.groups?.block_start,
                        block_value: first_block.groups?.block_startblock_value,
                        block_content: parseIfBlock(content),
                        index: first_block?.index,
                        index_end: closing_block?.index + closing_block.length + first_block?.length
                    });
                    break;
                }
            case "each":
                {
                    const content = template.substring(first_block?.index + first_block[0].length, closing_block.index);
                    blocks.push({
                        block_start: first_block.groups?.block_start,
                        block_value: first_block.groups?.block_value,
                        block_content: parse(content),
                        index: first_block?.index,
                        index_end: closing_block.index + closing_block?.length + first_block[0].length
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
        if (BLOCK_PARSING_REGEX.test(template_left)) {
            items.push({
                title: "block",
                content: parse(template_left),
                type: "item"
            });
            continue;
        }
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
        type: "items"
    };
    return root;
}
const ESCAPE_REGEX = /[&<>'"]/g;
const helpers = {};
function registerHelper(name, fn) {
    helpers[name] = fn;
}
const entity = {
    "<": "&lt;",
    ">": "&gt;",
    "&": "&amp;",
    "'": "&#39;",
    '"': "&#34;"
};
function escape(text) {
    let result = "";
    let text_left = text;
    let m;
    while(m = ESCAPE_REGEX.exec(text_left)){
        result += text_left.slice(0, m.index);
        result += entity[m[0]];
        text_left = text_left.slice(m.index + 1);
    }
    return result + text_left;
}
const COMPILE_OPTIONS = {
    escape: true
};
class renderObject {
    options;
    compiled;
    data;
    render_cache;
    var_cache;
    constructor(template, options = COMPILE_OPTIONS){
        this.template = template;
        this.options = COMPILE_OPTIONS;
        this.render_cache = {};
        this.var_cache = {};
        this.options = options;
        this.compiled = typeof template == "string" ? parse(template) : template;
    }
    stringCache(name) {
        const split = name.split(" "), action = split[0], key = split[1];
        return this.render_cache[name] = helpers[action] ? ()=>helpers[action](this.data[key])
         : ()=>this.options.escape && typeof this.data[name] == "string" ? escape(this.data[name]) : this.data[name]
        ;
    }
    renderString(item) {
        return this.render_cache[item.var]?.() ?? this.stringCache(item.var)();
    }
    renderBlock(block) {
        switch(block.block_start){
            case "if":
                {
                    for(let index = 0; index < block.block_content.length; index++){
                        const item = block.block_content[index];
                        switch(item.condition){
                            case undefined:
                                return this.render(item.content);
                            default:
                                if (item.condition.apply(this.data)) {
                                    return this.render(item.content);
                                }
                                break;
                        }
                    }
                    break;
                }
            default:
                throw new Error("Unknown block type: " + block.block_start);
        }
    }
    renderForeach(block) {
        let result = "";
        const old_data = this.data;
        const old_cache = this.var_cache;
        const value = block.block_value == "this" ? this.data : this.data[block.block_value];
        for(let vindex = 0; vindex < value.length; vindex++){
            this.data = value[vindex];
            this.var_cache = {};
            result += this.render(block.block_content);
        }
        this.data = old_data;
        this.var_cache = old_cache;
        return result;
    }
    render(tree) {
        let html = "";
        switch(tree.type){
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
                for (const item of tree.content){
                    html += this.render(item);
                }
                break;
            case "items":
                for (const item1 of tree.childs){
                    html += this.render(item1);
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
    start(data) {
        this.data = data;
        return this.render(this.compiled);
    }
    template;
}
function compile(template, options = COMPILE_OPTIONS) {
    const tree = new renderObject(template, options);
    Deno.writeTextFileSync("template.json", JSON.stringify(tree.compiled, null, 2));
    const compiled = function(data) {
        return tree.start(data);
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
registerHelper("JSON", (data)=>{
    return JSON.stringify(data);
});
registerHelper("raw", (data)=>{
    return data;
});
export { renderTemplate as renderTemplate, compile as compile, registerHelper as registerHelper };
