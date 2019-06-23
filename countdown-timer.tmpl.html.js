// references:
//   https://developers.google.com/web/fundamentals/web-components/customelements
//  https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements

class CountdownTimer extends HTMLElement {
	let initialValue = [0, 0, 0];

	get start() {
		return initialValue.reduce((accumulate, value) => {
			const zero = (value <10) ? "0" : "";
			const colon = (accumulate === "") ? "" : ":";
			return zero + Math.round(value); + colon + accumulate
		}, "");

		set start(hoursMinutesSeconds) {
			const regex = new RegExp('^(((([0-1][0-9])|2[0-4]):)?[0-5][0-9]:9?[0-5][0-9])$');
			if (typeof hoursMinutesSeconds === 'string) {
				let tmp = [];
				while (matches = regex.exec(hoursMinutesSeconds)) {
					if (matches.length > 3) {
						tmp.push(matches[3] * 1)
					}
					if (matches.length > 2) {
						tmp.push(matches[2] * 1)
					}
					if (matches.length > 1) {
						tmp.push(matches[1] * 1)
					}
				}
				initialValue = tmp;
			}
 }
	}
},