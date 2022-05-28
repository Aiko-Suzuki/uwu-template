interface item {
	title: string;
	slug: string;
	id: number;
	type: string;
	startdate: string;
	visible: string;
}

function generateArray(number:number){
    const data: item[] = [];
    for (let i = 1; i <= number; i++) {
        data.push({
            title: "Test Title &" + i,
            slug: "test-title>" + i,
            id: i,
            type: "post",
            startdate: new Date(new Date().getTime() - Math.floor(Math.random() * 10000000000)).toISOString().slice(0, 10),
            visible: `${Math.floor(Math.random() * 3) + 1}`,
        });
    }
    return data;
}

export {generateArray};