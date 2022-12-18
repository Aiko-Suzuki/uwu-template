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
                data = fn.apply(this.current_data ?? this.data);
            } catch (e) {
                data = fn.apply(this.data);
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
new Map();
registerHelper("JSON", (data)=>{
    return JSON.stringify(data);
});
registerHelper("raw", (data)=>{
    return data;
});
const template_string = `{{#each this}}
<tr id="list_item">
	<td>
		<div class="main__user">
			<div class="main__avatar" style="width:75px;border-radius:0%;">
				<img src="/api/anime/{{id}}/thumb" alt="">
			</div>
			<div class="main__meta">
				<h3>{{JSON title}}</h3>
				<span>ID : {{id}}, SLUG : {{slug}}</span>
			</div>
		</div>
	</td>
	<td>
		<div class="main__table-text main__table-text--rate">7.9</div>
	</td>
	<td>
		<div class="main__table-text">{{type}}</div>
	</td>
	<td>
		<div class="main__table-text">1392</div>
	</td>
	<td id="visible-{{id}}">
		{{#if this.visible == 1}}
			nested if test : {{#if this.visible == true}}{{id}}{{/if}} - {{#if this.visible == true}}{{type}}{{/if}}
			more nested test : {{#if this.visible == true}}{{type}}{{#if this.visible == true}} - {{id}}{{/if}}{{/if}}
		{{#elseif this.visible == 2}}
			<div class="main__table-text main__table-text--green">secret</div>
		{{#else}}
			<div class="main__table-text main__table-text--red">Hidden</div>
		{{/if}}
	</td>
	<td>
		<div class="main__table-text">{{startdate}}</div>
	</td>
	<td>
		<div class="main__table-btns">
			<a href="#" id="toggleVisible-{{id}}" data-visible="{{visible}}" data-action="visible" data-target="/admin/anime/{{id}}" class="main__table-btn main__table-btn--view">
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M21.92,11.6C19.9,6.91,16.1,4,12,4S4.1,6.91,2.08,11.6a1,1,0,0,0,0,.8C4.1,17.09,7.9,20,12,20s7.9-2.91,9.92-7.6A1,1,0,0,0,21.92,11.6ZM12,18c-3.17,0-6.17-2.29-7.9-6C5.83,8.29,8.83,6,12,6s6.17,2.29,7.9,6C18.17,15.71,15.17,18,12,18ZM12,8a4,4,0,1,0,4,4A4,4,0,0,0,12,8Zm0,6a2,2,0,1,1,2-2A2,2,0,0,1,12,14Z"/></svg>
			</a>
			<a href="/admin/anime/{{id}}" class="main__table-btn main__table-btn--edit">
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M5,18H9.24a1,1,0,0,0,.71-.29l6.92-6.93h0L19.71,8a1,1,0,0,0,0-1.42L15.47,2.29a1,1,0,0,0-1.42,0L11.23,5.12h0L4.29,12.05a1,1,0,0,0-.29.71V17A1,1,0,0,0,5,18ZM14.76,4.41l2.83,2.83L16.17,8.66,13.34,5.83ZM6,13.17l5.93-5.93,2.83,2.83L8.83,16H6ZM21,20H3a1,1,0,0,0,0,2H21a1,1,0,0,0,0-2Z"/></svg>
			</a>
			<a href="#modal-delete" data-action="delete" data-value="/api/anime/{{id}}" class="main__table-btn main__table-btn--delete open-modal">
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M20,6H16V5a3,3,0,0,0-3-3H11A3,3,0,0,0,8,5V6H4A1,1,0,0,0,4,8H5V19a3,3,0,0,0,3,3h8a3,3,0,0,0,3-3V8h1a1,1,0,0,0,0-2ZM10,5a1,1,0,0,1,1-1h2a1,1,0,0,1,1,1V6H10Zm7,14a1,1,0,0,1-1,1H8a1,1,0,0,1-1-1V8H17Z"/></svg>
			</a>
		</div>
	</td>
</tr>
{{/each}}`;
const template = compile(template_string, {
    escape: true
});
const data = [];
for(let i = 1; i <= 1000; i++){
    data.push({
        title: "Test Title &" + i,
        slug: "test-title>" + i,
        id: i,
        type: "TV",
        startdate: new Date(new Date().getTime() - Math.floor(Math.random() * 10000000000)).toISOString().slice(0, 10),
        visible: Math.floor(Math.random() * 3) + 1
    });
}
const pef = [];
for(let i1 = 0; i1 < 1000; i1++){
    const start = performance.now();
    template(data);
    pef.push(performance.now() - start);
}
console.log((pef.reduce((a, b)=>a + b, 0) / pef.length).toFixed(6) + "ms");
