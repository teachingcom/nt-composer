
/** shows a quick error message */
export default function toast(type, message) {
	const msg = document.getElementById('msg');
	msg.className = `${type} show`;
	msg.innerText = message;
	setTimeout(() => msg.className = type, 3000);
}