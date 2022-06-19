import * as nnt from "./mod.ts";
const template = Deno.readTextFileSync("bench/template/test.nnt");
const template_loop = Deno.readTextFileSync("bench/template/array_loop.nnt");

const formatdate = (date: string) => {
    const d = new Date(date);
    const h = d.getUTCHours();
    const m = d.getUTCMinutes();
    const y = d.getUTCFullYear();
    const M = d.getUTCMonth() + 1;
    const D = d.getUTCDate();
    return `${h < 10 ? "0" + h : h}:${m < 10 ? "0" + m : m} ${y}-${M < 10 ? "0" + M : M}-${D < 10 ? "0" + D : D}`;
}

nnt.registerHelper("formatdate",formatdate);

const data = [];

// randomly fill the data array with item
for (let i = 1; i <= 100; i++) {
	data.push({
		title: "Test Title &" + i,
		slug: "test-title>" + i,
		id: i,
		type: "TV",
		startdate: new Date(new Date().getTime() - Math.floor(Math.random() * 10000000000)).toISOString().slice(0, 10),
        // random asing 1 , 2 or 3
		visible: Math.floor(Math.random() * 3) + 1,
	});
}
const template_compiled = nnt.compile(`${template}`);
const template_loop_compiled = nnt.compile(`${template_loop}`);

const other_test = Deno.readTextFileSync("bench/template/pagi.nnt");
const other_template_compiled = nnt.compile(`${other_test}`);

const recursive_each = Deno.readTextFileSync("bench/template/recursive_each.nnt");
const recursive_each_compiled = nnt.compile(`${recursive_each}`);

const time_start = performance.now();
const res = template_compiled(data);
const time_end = performance.now();
console.log(`${res.length} characters in ${time_end - time_start}ms`);

const res_2 = other_template_compiled([
    {
        "type": "page",
        "page": 1,
        "active": true
    },
    {
        "type": "page",
        "page": 2,
        "active": false
    },
    {
        "type": "page",
        "page": 3,
        "active": false
    }
]);

const res3 = template_loop_compiled({
    "items": {
        list : [
            "item 1",
            "item 2",
            "item 3",
        ],
    },
});

let data_recu:any = [];
for (let i = 1; i <= 100; i++) {
	data_recu.push({
		title: "Test Title > &" + i,
		slug: "test-title>" + i,
		id: i,
		type: "TV",
        genre : [
            "genre 1",
            "genre 2",
            "genre 3",
        ],
		startdate: new Date(new Date().getTime() - Math.floor(Math.random() * 10000000000)).toISOString().slice(0, 10),
        // random asing 1 , 2 or 3
		visible: Math.floor(Math.random() * 3) + 1,
	});
}

const res4 = recursive_each_compiled(data_recu)

Deno.writeTextFileSync("output/test_out.html", res);
Deno.writeTextFileSync("output/test_out_2.html", res_2);
Deno.writeTextFileSync("output/test_out_3.html", res3);
Deno.writeTextFileSync("output/test_out_4.html", res4);

