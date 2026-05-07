
let orderTable;

$(document).ready(function () {

    if (typeof error !== 'undefined' && error) {
        alert(error);
    }
    if (typeof success !== 'undefined' && success) {
        alert(success);
    }

    orderTable = $('#orderTable').DataTable({
        scrollX: true,
        pageLength: 10,
        lengthMenu: [5, 10, 25, 50, 100],
        dom: 'lBfrtip',
        buttons: [{
            extend: 'copy',
            title: 'Order Data'
        },
        {
            extend: 'excel',
            title: 'Order Data',
            filename: 'order-data'
        }]
    });

    //open user model
    $('#addnewItem').click(function () {
        $('#orderForm')[0].reset();
        $('#orderModal').fadeIn();
    });

    $('.close').click(function () {
        $('#orderModal').fadeOut();
    });

    
    function calculateOrder() {
        let qty = parseFloat($('#ordQty').val()) || 0;
        let cost = parseFloat($('#ordCost').val()) || 0;
        let sgst = parseFloat($('#ordSGST').val()) || 0;
        let cgst = parseFloat($('#ordCGST').val()) || 0;
        let discount = parseFloat($('#discount').val()) || 0;
        let taxless = qty * cost;
        let sgstRs = taxless * sgst / 100;
        let cgstRs = taxless * cgst / 100;
        let totalGST = sgstRs + cgstRs;
        let discountCost = taxless * discount / 100;
        let netTotal = taxless + totalGST - discountCost;
        $('#ordTaxlessTotal').val(taxless.toFixed(2));
        $('#ordSGSTRs').val(sgstRs.toFixed(2));
        $('#ordCGSTRs').val(cgstRs.toFixed(2));
        $('#ordTotalGST').val(totalGST.toFixed(2));
        $('#discountCost').val(discountCost.toFixed(2));
        $('#ordGSTTotal').val(totalGST.toFixed(2));
        $('#ordNetTotal').val(netTotal.toFixed(2));
    }

    function calculateInvoice() {
        let qty = parseFloat($('#invQty').val()) || 0;
        let cost = parseFloat($('#invCost').val()) || 0;
        let sgst = parseFloat($('#invSGST').val()) || 0;
        let cgst = parseFloat($('#invCGST').val()) || 0;
        let taxless = qty * cost;
        let sgstRs = taxless * sgst / 100;
        let cgstRs = taxless * cgst / 100;
        let totalGST = sgstRs + cgstRs;
        let netTotal = taxless + totalGST;
         $('#invTaxlessTotal').val(taxless.toFixed(2));
        // $('#invSGST').val(sgst.toFixed(2));
        // $('#invCGST').val(cgst.toFixed(2));
        $('#invSGSTRs').val(sgstRs.toFixed(2));
        $('#invCGSTRs').val(cgstRs.toFixed(2));
        $('#invTotalGST').val(totalGST.toFixed(2));
        $('#invGSTTotal').val(totalGST.toFixed(2));
        $('#invNetTotal').val(netTotal.toFixed(2));
    }
$(document).on('wheel', 'input[type="number"]', function (e) {
    $(this).blur();
});
    
    $('#ordQty,#ordCost,#ordSGST,#ordCGST,#discount').on('keyup change', function () {
        calculateOrder();
    });

    $('#invQty,#invCost,#invSGST,#invCGST').on('input keyup change', function () {
        calculateInvoice();
    });

    $('#orderForm').submit(function (e) {
        e.preventDefault();
        $.ajax({
            url: '/orders',
            method: 'POST',
            data: $('#orderForm').serialize(),
            success: function (response) {
                let o = response.order;
                orderTable.row.add([
                    o.item,
                    o.ordQty,
                    o.ordCost,
                    o.ordTaxlessTotal,
                    o.ordGST,
                    o.ordSGST,
                    o.ordSGSTRs,
                    o.ordCGST,
                    o.ordCGSTRs,
                    o.ordTotalGST,
                    o.ordGSTTotal,
                    o.ordNetTotal,
                    o.invQty,
                    o.invCost,
                    o.invGST,
                    o.invSGST,
                    o.invSGSTRs,
                    o.invCGST,
                    o.invCGSTRs,
                    o.invTotalGST,
                    o.discount,
                    o.discountCost,
                    o.invTaxlessTotal,
                    o.invGSTTotal,
                    o.invNetTotal
                ]).draw(false);
                alert('Order Added Successfully');
                $('#orderModal').fadeOut();
                $('#orderForm')[0].reset();
            },
            error: function () {
                alert('Error Saving Order');
            }
        });
    });
});