import React from 'react'

export default ({ error }) => <div className="modal is-active">
	<div className="modal-background"></div>
	<div className="modal-content">
		<div className="box">
			{ error }
			<p><a href="#" onClick={() => window.location.reload()}>Reload the page</a></p>
		</div>
	</div>
</div>
