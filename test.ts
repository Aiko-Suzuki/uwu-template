import * as nnt from "./mod.ts";
const template = Deno.readTextFileSync("bench/test.nnt");
interface item {
	title: string;
	slug: string;
	id: number;
	type: string;
	startdate: string;
	visible: boolean;
}

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

const data_100: item[] = [];

// randomly fill the data array with item
for (let i = 0; i < 100; i++) {
	data_100.push({
		title: "Test Title " + i,
		slug: "test-title-" + i,
		id: i,
		type: "TV",
		startdate: "2020-01-01",
		visible: true,
	});
}
const template_compiled = nnt.compile(`${template}`);

const performance_start = performance.now();
const res = template_compiled(data_100);
const performance_end = performance.now();
console.log(`${performance_end - performance_start}ms`);


Deno.writeTextFileSync("test_out.html", res);
