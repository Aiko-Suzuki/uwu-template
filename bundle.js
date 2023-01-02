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
    const regex = new RegExp(ITEM_PARSING_REGEX, "gms");
    while((m = regex.exec(template_left)) != null){
        if (!m) break;
        const start = m.index;
        const end = m.index + m[0].length;
        const split = m[1].split(" "), action = split[0], key = split[1];
        if (m[0].startsWith("{{!--") && m[0].endsWith("--}}")) {
            template_left = template_left.replace(m[0], "");
            continue;
        }
        const item = {
            type: "var",
            content: m[0],
            var: m[1],
            fn: new Function("data", "return this." + (key ? key : m[1])),
            helper: key ? action : undefined,
            key: key,
            index: start,
            index_end: true_index + end
        };
        const before = template_left.substring(0, item.index);
        if (regex.test(before)) {
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
    items.sort((a, b)=>a.index - b.index);
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
    for (const m of open_if){
        if (m.groups?.block_start == "if") {
            if (!first_if) {
                first_if = m;
                addItem("if", m);
            } else {
                temp_block.push(m);
            }
        } else if (m.groups?.block_start == "elseif") {
            if (temp_block.length == 0) {
                addItem("elseif", m);
            }
        } else if (m.groups?.block_close == "if") {
            if (temp_block.length == 0) {
                addItem("ifclose", m);
            } else {
                temp_block.pop();
            }
        } else if (!m.groups?.block_start && !m.groups?.block_close) {
            if (temp_block.length == 0) {
                addItem("else", m);
            }
        }
    }
    item_order.sort((a, b)=>a.index - b.index);
    if (item_order.length == 2 && item_order[0].type == "if" && item_order[1].type == "ifclose") {
        let content = template.substring(item_order[0].index + item_order[0].length, item_order[1].index);
        blocks.push({
            type: "if",
            condition: new Function("data", `return !!(${item_order[0].condition})`) ?? undefined,
            content: parse(content),
            str_condition: item_order[0].condition
        });
        return blocks;
    }
    temp_block = [];
    for (const item of item_order){
        switch(item.type){
            case "if":
                if (temp_block.length == 0) {
                    temp_block.push(item);
                }
                break;
            case "elseif":
                if (temp_block.length == 1) {
                    const lastitem = temp_block.pop();
                    if (lastitem) {
                        const content1 = template.substring(lastitem.index + lastitem.length, item.index).trim();
                        blocks.push({
                            type: lastitem.type,
                            condition: new Function("data", `return !!(${lastitem.condition})`) ?? undefined,
                            content: parse(content1),
                            str_condition: lastitem.condition
                        });
                    }
                }
                temp_block.push(item);
                break;
            case "else":
                if (temp_block.length == 1) {
                    const lastitem1 = temp_block.pop();
                    if (lastitem1) {
                        const content2 = template.substring(lastitem1.index + lastitem1.length, item.index).trim();
                        blocks.push({
                            type: lastitem1.type,
                            condition: lastitem1.condition ? new Function("data", `return !!(${lastitem1.condition})`) : undefined,
                            content: parse(content2),
                            str_condition: lastitem1.condition
                        });
                    }
                    temp_block.push(item);
                }
                break;
            case "ifclose":
                if (temp_block.length == 1) {
                    const lastitem2 = temp_block.pop();
                    if (lastitem2) {
                        let content3 = lastitem2.type == "if" ? template.substring(lastitem2.index + lastitem2.length, item.index + item.length) : template.substring(lastitem2.index + lastitem2.length, item.index);
                        blocks.push({
                            type: lastitem2.type,
                            condition: lastitem2.condition ? new Function("data", `return !!(${lastitem2.condition})`) : undefined,
                            content: parse(content3),
                            str_condition: lastitem2.condition
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
    const regex = new RegExp(BLOCK_PARSING_REGEX, "gms");
    const match = template.matchAll(regex);
    let first_block;
    let closing_block;
    const temp_block = [];
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
    if (first_block && closing_block) {
        switch(first_block.groups?.block_start){
            case "if":
                {
                    const content = template.substring(first_block?.index, (closing_block?.index) + closing_block.length + first_block?.length);
                    blocks.push({
                        block_start: first_block.groups?.block_start,
                        block_value: first_block.groups?.block_value,
                        block_content: parseIfBlock(content),
                        index: first_block?.index,
                        index_end: (closing_block?.index) + closing_block.length + first_block?.length
                    });
                    break;
                }
            case "each":
                {
                    const content1 = template.substring((first_block?.index) + first_block[0].length, closing_block.index);
                    blocks.push({
                        block_start: first_block.groups?.block_start,
                        block_value: first_block.groups?.block_value,
                        fn: first_block.groups?.block_value ? new Function("data", `return this.${first_block.groups?.block_value}`) : undefined,
                        block_content: parse(content1),
                        index: first_block?.index,
                        index_end: closing_block.index + closing_block?.length + first_block[0].length
                    });
                }
        }
    }
    for(let index = 0; index < blocks.length; index++){
        const block = blocks[index];
        let before = template_left.substring(0, block.index);
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
        template_left = template_left.substring(block.index_end - 1);
        if (regex.test(template_left)) {
            items.push({
                title: "block",
                content: parse(template_left.trim()),
                type: "item"
            });
            continue;
        }
        if (index === blocks.length - 1) {
            items.push({
                title: "after_var",
                content: parseString(template_left.trim()),
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
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#x27;",
    "`": "&#x60;"
};
function escape(text) {
    let result = "";
    let text_left = text;
    let m;
    while(m = ESCAPE_REGEX.exec(text_left)){
        result += text_left.slice(0, m.index) + entity[m[0]];
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
    current_data;
    render_cache;
    constructor(template, options = COMPILE_OPTIONS){
        this.template = template;
        this.options = COMPILE_OPTIONS;
        this.render_cache = {};
        this.stringCache = (item)=>{
            const name = item.var;
            return this.render_cache[name] = helpers[item.helper] ? ()=>helpers[item.helper](this.getData(item?.fn)) : ()=>{
                const val = name == "this" ? this.current_data || this.data : this.getData(item?.fn);
                return this.options.escape && typeof val == "string" ? escape(val) : val;
            };
        };
        this.renderString = (item)=>{
            return this.render_cache[item.var]?.() ?? this.stringCache(item)();
        };
        this.renderBlock = (block)=>{
            switch(block.block_start){
                case "if":
                    {
                        for(let index = 0; index < block.block_content.length; index++){
                            const item = block.block_content[index];
                            switch(item.condition){
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
        this.renderForeach = (block)=>{
            let result = "";
            const old_data = this.current_data;
            const value = block.block_value == "this" ? this.data : this.getData(block?.fn);
            if (!Array.isArray(value)) throw new Error("each value is not an array");
            for(let index = 0; index < value.length; index++){
                this.current_data = value[index];
                result += this.render(block.block_content);
            }
            this.current_data = old_data;
            return result;
        };
        this.render = (tree)=>{
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
        };
        this.start = (data)=>{
            this.data = data;
            return this.render(this.compiled);
        };
        this.options = options;
        this.compiled = typeof template == "string" ? parse(template) : template;
    }
    getData(fn) {
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
    stringCache;
    renderString;
    renderBlock;
    renderForeach;
    render;
    start;
    template;
}
function compile(template, options = COMPILE_OPTIONS) {
    const compiled = new renderObject(template, options);
    return compiled.start;
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
