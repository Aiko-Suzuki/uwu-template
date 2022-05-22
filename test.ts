import { renderTemplate,compile } from "./mod.ts";
const template = Deno.readTextFileSync("bench/test.nnt");
interface item {
	title: string;
	slug: string;
	id: number;
	type: string;
	startdate: string;
	visible: boolean;
}

const data_100: item[] = [];

// randomly fill the data array with item
for (let i = 0; i < 1000; i++) {
	data_100.push({
		title: "Test Title " + i,
		slug: "test-title-" + i,
		id: i,
		type: "TV",
		startdate: "2020-01-01",
		visible: true,
	});
}
const template_compiled = compile(`{#foreach this}${template}{/foreach}`);

const performance_start = performance.now();
const res = template_compiled(data_100);
const performance_end = performance.now();
console.log(`${performance_end - performance_start}ms`);


Deno.writeTextFileSync("test_out.html", res);
