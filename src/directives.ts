
export function getSelectAll() {
    return {
        inserted: function (el: HTMLElement) {

            el.addEventListener("focus", () => setTimeout(() => (el as HTMLInputElement).select()))
        }
    }
}