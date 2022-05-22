// deno-lint-ignore-file no-explicit-any
interface block {
	block_start: string;
	block_value: string;
	block_content: any;
	block_content_2?: any;
	index: number;
	index_end: number;
}
interface item {
	title: string;
	childs?: item[];
	content?: any;
    var ?: string;
	type: "block" | "item" | "string" | "foreach" | "var" |"list";
    index?: number;
    index_end?: number;
}
export type {item, block};