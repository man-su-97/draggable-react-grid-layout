import React from "react";
import GridLayout from "react-grid-layout";
import layout from "../layout-config"

export const LandingSection = () => {
	

	return (
		<div>
			<GridLayout
				className="layout"
				
				cols={12}
				rowHeight={30}
				width={1200}
                
			>
				<div key="a" className="size-20 bg-amber-50">a</div>
				<div key="b" className="size-20 bg-amber-50">b</div>
				<div key="c" className="size-20 bg-amber-50">c</div>
			</GridLayout>
		</div>
	);
};
