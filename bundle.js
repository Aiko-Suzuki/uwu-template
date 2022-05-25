// deno-fmt-ignore-file
// deno-lint-ignore-file
// This code was bundled using `deno bundle` and it's not recommended to edit it manually

const ITEM_PARSING_REGEX = /\{{(.*?)}}/g;
const BLOCK_PARSING_REGEX = /({{#(?<block_start>.*?) (?<block_value>.*?)}})(?<block_content>.*?(?:{{#(\k<block_start>.*?) (\k<block_value>.*?)}}(.*?){{\/\k<block_start>}}.*?){0,}){{\/\k<block_start>}}/gms;
const BLOCK_INSIDE_REGEX = /({{#(?<block_start>.*?) (?<block_value>.*?)}})(?<block_content>.*?(?:({{#(?<block_value_2>.*?) (.*?)}}(.*?){{(\/\k<block_value_2>)}}).*?){0,}){{(?:(?<block_next>#.*?|\/.*?))}}/gs;
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
    while(m = BLOCK_INSIDE_REGEX.exec(template)){
        if (!m) break;
        lastype = m.groups?.block_start ? m.groups?.block_start.replace("#", "") : undefined ?? lastype;
        lastcondition = m.groups?.block_value ?? lastcondition;
        if (!gtype) {
            gtype = m.groups?.block_start.replace("#", "") ?? "";
        }
        console.log(m.groups);
        const block = {
            type: lastype,
            content: parse(m.groups?.block_content ?? ""),
            condition: lastcondition ? new Function("data", `return !!(${lastcondition})`) : undefined,
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
        const child_len = block.block_content.childs.length;
        for(let vindex = 0; vindex < value.length; vindex++){
            this.data = value[vindex];
            this.var_cache = {};
            for(let index = 0; index < child_len; index++){
                result += this.render(block.block_content.childs[index]);
            }
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
            case "item":
                for (const item1 of tree.childs){
                    html += this.render(item1);
                }
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
