import React from 'react'
import { BounceLoader } from 'react-spinners'

export default () => (
	<div className="app-loader-container">
		<div className="app-loader-inner">
			<BounceLoader
				color={'#23d160'}
				loading={true}
			/>
		</div>
	</div>
)
