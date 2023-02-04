// deno-lint-ignore-file no-explicit-any
interface block {
	block_start: string;
	block_value: string;
	block_value_2?: string;
	fn?: any;
	block_content: any;
	block_content_2?: any;
	block_content_3?: any;
	index: number;
	index_end: number;
}

interface block_inside {
	type: "if" | "else" | "elseif";
	content: any;
	condition?: any;
	str_condition?: string;

	values?: any;
}

interface item {
	title: string;
	childs?: item[];
	content?: any;
	var?: string;
	type: "block" | "item" | "string" | "each" | "var" | "list" | "items";
	index?: number;
	index_end?: number;
}
export type { item, block, block_inside };
