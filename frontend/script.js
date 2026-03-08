function addItem() {
    const div = document.createElement('div');
    div.className = 'item-row';
    div.innerHTML =
        '<input type="text" placeholder="Service Description" class="desc"> \
       <input type="number" placeholder="0.00" class="amt">';
    document.getElementById('item-list').appendChild(div);
}

document.querySelector("form").addEventListener("submit", async function (e) {
    e.preventDefault();

    const descs = document.querySelectorAll(".desc");
    const amts = document.querySelectorAll(".amt");

    let services = [];
    let subtotal = 0;

    for (let i = 0; i < descs.length; i++) {
        const name = descs[i].value;
        const price = parseFloat(amts[i].value);

        if (name && price) {
            services.push({
                name: name,
                price: price,
                quantity: 1
            });

            subtotal += price;
        }
    }

    const gst = subtotal * 0.18;
    const totalAmount = subtotal + gst;

    const data = {
        fullName: document.querySelector('input[placeholder="Enter name"]').value,
        email: document.querySelector('input[placeholder="Enter email"]').value,
        phone: document.querySelector('input[placeholder="Enter phone"]').value,
        companyName: document.querySelector('input[placeholder="Enter company"]').value,
        services,
        subtotal,
        gst,
        totalAmount
    };

    const response = await fetch("/create-quotation", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    });

    const result = await response.json();

    if (result.quotationId) {
        window.location.href = `/quotation/${result.quotationId}/pdf`;
    }
});
