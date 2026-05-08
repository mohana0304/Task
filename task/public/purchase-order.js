jQuery(document).ready(function () {
	// For Purchase Order Invoices
	new InvoiceCreateModal();
	//#region actions show hide logic start
	setAccess("Purchase Orders");
	setAddButtonVisibility();
	var tripConfig = getTripConfig();
	var autoGenPoNumber = tripConfig && tripConfig.autoGenPoNumber ? tripConfig.autoGenPoNumber : false;
	var autoGenGrnNumber = tripConfig && tripConfig.autoGenGrnNumber ? tripConfig.autoGenGrnNumber : false;
	if (tripConfig && tripConfig.autoGenGrnWthPoNum && tripConfig.autoGenGrnWthPoNum == true) {
		autoGenGrnNumber = true;
	}
	var editPoAddressInfo = tripConfig && tripConfig.editPoAddressInfo ? tripConfig.editPoAddressInfo : false;
	//#endregion actions show hide logic end

	$('#addPoModal').on('hidden.bs.modal', function () {
		$("#poDetailsEntryTable").find("tr:gt(0)").remove();
		$('.branch-select2, .vendor-select2, .part-select2, .vehicleModel-select2, .po-location-select2').val(null).trigger('change.select2');
		$('#poEntryForm').trigger('reset');
		$('#orderedQty, #orderedCost, #orderedGST, #grandTotal').text('0');
		$('#addPoModal .poHeaderId').val('new');
	});

	$('#addPoModal').on('shown.bs.modal', function () {
		$("#poEntryForm #poDate").datetimepicker({
			format: "DD/MM/YYYY hh:mm A",
			sideBySide: true
		});
		$("#poEntryForm #poDate").data("DateTimePicker").defaultDate(moment(moment()));
		const tBody = '#poDetailsEntryTable tbody';
		if (checkIfEmptyTable(tBody)) {
			let tds = getAddPoDetailTableRowHtml(true);
			$(tBody).append(tds);
			initLastPOItemSelectors();
		}
		if (autoGenPoNumber == true) {
			$('#poNumber').prop('readonly', true);
			$('#poNumber').prop('required', false);
		} else {
			$('#poNumber').prop('readonly', false);
			$('#poNumber').prop('required', true);
		}
		if (editPoAddressInfo == true) {
			$('.billTo, .shipTo').prop('readonly', false);
		} else {
			$('.billTo, .shipTo').prop('readonly', true);
		}
	});

	$('#poReceiveModal').on('hidden.bs.modal', function () {
		$('#poReceiveForm').trigger('reset');
		$('#totalReceivedQty, #totalReceivedCost, #totalReceivedCostGst').text('0');
	});

	let branches = [];
	$.ajax({
		type: 'GET',
		url: path + '/api/inventories/branches?status=true',
		headers: { 'X-AT-SessionToken': localStorage.sessionToken }
	}).done(function (response) {
		if (response.success === true) {
			branches = response.results.map(function (obj) {
				var rObj = {};
				rObj.id = obj.id;
				rObj.text = obj.name;
				rObj.address = obj.address;
				return rObj;
			});
			$('.branch-select2,#branch-filter').select2({
				theme: 'classic',
				placeholder: 'Select Branch',
				data: branches,
				allowClear: true,
			});
			$('.branch-select2,#branch-filter').val(null).trigger('change');
		} else {
			alert(response.message ? response.message : response.error);
		}
	});

	$.ajax({
		type: 'GET',
		url: path + "/api/inventories/vendors?status=true",
		headers: { 'X-AT-SessionToken': localStorage.sessionToken },
	}).done(function (response) {
		if (response.success === true) {
			const vendors = response.results.map(function (obj) {
				var rObj = {};
				rObj.id = obj.id;
				rObj.text = obj.name;
				return rObj;
			});
			$(".vendor-select2,#vendor-filter").select2({
				theme: "classic",
				placeholder: "Select Vendor",
				data: vendors,
				allowClear: true,
			});
			$('.vendor-select2,#vendor-filter').val(null).trigger('change');
		} else {
			alert("Cant load vendor. Please try again later.");
		}
	});

	let parts = [];
	let partsObjArray = [];
	$.ajax({
		type: 'GET',
		url: path + "/api/inventories/parts?status=true",
		headers: { 'X-AT-SessionToken': localStorage.sessionToken },
	}).done(function (response) {
		if (response.success === true) {
			partsObjArray = response.results;
			parts = response.results.map(function (obj) {
				var rObj = {};
				rObj.id = obj.id;
				rObj.text = obj.name;
				return rObj;
			});
			$(".part-select2").select2({
				theme: "classic",
				placeholder: "Select Part",
				data: parts,
				allowClear: true,
			});
			$('.part-select2').val(null).trigger('change.select2');
		} else {
			alert("Cant fetch parts. Please try again later!");
		}
	});

	let poStatusList = [];
	$.ajax({
		type: 'GET',
		url: path + '/api/po/listPoStatus/',
		headers: { 'X-AT-SessionToken': localStorage.sessionToken }
	}).done(function (response) {
		if (response.success === true) {
			poStatusList = response.results.status;
			let statusList = response.results.status.map(function (obj) {
				var rObj = {};
				rObj.id = obj.id;
				rObj.text = obj.text;
				return rObj;
			});
			$("#status-filter").select2({
				theme: "classic",
				placeholder: "Select Status",
				data: statusList,
				allowClear: true,
			});
		} else {
			alert(response.message ? response.message : response.error);
		}
		loadPoTable();
	});

	let locations = [];
	$.ajax({
		type: 'GET',
		url: path + '/api/inventories/locations?status=true',
		headers: { 'X-AT-SessionToken': localStorage.sessionToken }
	}).done(function (response) {
		if (response.success === true) {
			locations = response.results.map(function (obj) {
				var rObj = {};
				rObj.id = obj.id;
				rObj.text = obj.name;
				rObj.BranchId = obj.BranchId;
				return rObj;
			});
			scope.locations = locations;
			$('.po-location-select2').select2({
				theme: 'classic',
				placeholder: 'Select Location',
				data: locations,
				allowClear: true,
			});
			$('.po-location-select2').val(null).trigger('change');
		} else {
			alert(response.message ? response.message : response.error);
		}
	});

	let vehicleModels = [];
	$.ajax({
		dataType: "json",
		url: path + "/api/serviceschedules/vehiclemodels",
		headers: { 'X-AT-SessionToken': localStorage.sessionToken },
		success: function (json) {
			if (json.success === true) {
				vehicleModels = json.results.map(function (obj) {
					var rObj = {};
					rObj.id = obj.id;
					rObj.text = getVehicleBrandModelName(obj);
					return rObj;
				});
				$("#poInfoTable .vehicleModel-select2").select2({
					theme: "classic",
					placeholder: "Select a model",
					allowClear: true,
					data: vehicleModels,
				});
			} else {
				alert("Cant load vehicle models. Please try again later.");
			}
		}
	});

	$.ajax(path + "/api/servicelogs/servicelist", {
		headers: { "X-AT-SessionToken": localStorage.getItem("sessionToken") },
	}).done(response => {
		if (!response.success) {
			return alert("Error while fetching vehicle service types!");
		}
		scope.vehicleServiceTypes = response.results.map((st) => ({ id: st.id, text: `${st.componentName} - ${st.serviceName}` }));
	});

	$('#branch').change(function () {
		populateLocationSelection($(this).val());
	});

	//#region dynamic row CRUD
	$('#dynamicOthersAdd').click(function () {
		if (!$(".branch-select2").val()) {
			return alert('Please select branch');
		}
		let tds = getAddPoDetailTableRowHtml();
		$('#poDetailsEntryTable tbody').append(tds);
		const selectedBranchId = $('.branch-select2').val();
		initLastPOItemSelectors(null, null, selectedBranchId);
	});

	function initLastPOItemSelectors(partId, vehicleModelId, selectedBranchId, vehicleServiceTypeId) {
		let assignedParts = [];
		if (selectedBranchId) {
			assignedParts = getPartsAssignedToBranch(selectedBranchId, partsObjArray);
		}
		const assignedPartsSelect = assignedParts.length > 0 ? getDataForSelectInput(assignedParts) : parts;

		$('#poDetailsEntryTable .part-select2:last').select2({
			theme: 'classic',
			placeholder: 'Select Part',
			data: assignedPartsSelect,
			allowClear: true,
		});
		$('#poDetailsEntryTable .vehicleModel-select2:last').select2({
			theme: 'classic',
			placeholder: 'Select Vehicle Model',
			data: vehicleModels,
			allowClear: true,
		});
		$("#poDetailsEntryTable .vehicleServiceType-select2:last").select2({
			theme: "classic",
			placeholder: "Select Service Type",
			data: scope.vehicleServiceTypes,
		});
		$('#poDetailsEntryTable .part-select2:last').val(partId).trigger('change.select2');
		$('#poDetailsEntryTable .vehicleModel-select2:last').val(vehicleModelId).trigger('change.select2');
		$("#poDetailsEntryTable .vehicleServiceType-select2:last").val(vehicleServiceTypeId).trigger("change.select2");
	}

	$('#poDetailsEntryTable').on('click', '.dynamicDelete', function () {
		$(this).closest('tr').remove();
		computeTotalOrderCost();
	});
	//#endregion

	$('#poInfoTable').on('click', '.edit', function (e) {
		e.preventDefault();
		var id = $(this).data('id');
		$.ajax({
			type: 'GET',
			url: path + '/api/po/' + id,
			headers: { 'X-AT-SessionToken': localStorage.sessionToken }
		}).done(function (response) {
			if (response.success === true) {
				var poHeader = response.purchaseOrder;
				var billTo = poHeader.addressInfo && poHeader.addressInfo.billTo || "";
				var shipTo = poHeader.addressInfo && poHeader.addressInfo.shipTo || "";
				$('#addPoModal .poHeaderId').val(poHeader.id);
				$('#poNumber').val(poHeader.poNumber);
				$('#branch').val(poHeader.BranchId).trigger('change.select2');
				$('#vendor').val(poHeader.VendorId).trigger('change.select2');
				$('#location').val(poHeader.LocationId).trigger('change.select2');
				$('#poDate').val(moment(poHeader.orderDate).format('DD/MM/YYYY hh:mm A'));
				$('#cost').val(poHeader.orderedCost);
				$('.billTo').val(billTo);
				$('.shipTo').val(shipTo);
				$('.poNote').val(poHeader.note);
				populateLocationSelection(poHeader.BranchId, poHeader.LocationId);
				$.ajax({
					type: 'GET',
					url: path + '/api/po/' + id + '/details',
					headers: { 'X-AT-SessionToken': localStorage.sessionToken }
				}).done(function (response) {
					if (response.success === true) {
						var poDetails = response.results;
						if (poDetails && Object.keys(poDetails).length > 0) {
							$('#poDetailsEntryTable tbody').html('');
							let tds = '', counter = 1;
							poDetails.forEach(poDetail => {
								var partDetails = poDetail.Part ? (poDetail.Part.PartDetails ? poDetail.Part.PartDetails : []) : [];
								var stockDetails = { minQty: 0, maxQty: 0, minOrderQty: 0 };
								let partDetail = partDetails.find(x =>
									x.PartId == poDetail.PartId &&
									x.BranchId == poHeader.BranchId &&
									x.VehicleModelId == (poDetail.VehicleModelId ? poDetail.VehicleModelId : null)
								);
								if (partDetail) {
									stockDetails['minQty'] = partDetail.minQty || 0;
									stockDetails['maxQty'] = partDetail.maxQty || 0;
									stockDetails['minOrderQty'] = partDetail.minOrderQty || 0;
								}
								var unitCost = Number(Number(poDetail.orderedCost) / parseInt(poDetail.orderedQty)).toFixed(2);
								tds = getTableCellInput("part", "select", false);
								tds += getTableCellInput("vehicleServiceType", "select", false);
								tds += getTableCellInput('vehicleModel', 'select', false);
								tds += getTableCellLabel(`Min Order Qty : ${stockDetails.minOrderQty}</br> Min/Max Qty : ${stockDetails.minQty} / ${stockDetails.maxQty}</br> Avail Qty : `, 12);
								tds += getTableCellInput('orderQty', 'number', true);
								tds += getTableCellInput('unitCost', 'number', true);
								tds += getTableCellInput('taxlessTotal', 'number', 'readonly');
								tds += getTableCellInput('SGSTPercentage', 'number');
								tds += getTableCellInput('SGSTCost', 'number', 'readonly');
								tds += getTableCellInput('CGSTPercentage', 'number');
								tds += getTableCellInput('CGSTCost', 'number', 'readonly');
								tds += getTableCellInput('GST', 'number', 'readonly');
								tds += getTableCellInput('DiscountPercentage', 'number');
								tds += getTableCellInput('DiscountCost', 'number', 'readonly');
								tds += getTableCellInput('NetTotal', 'number', 'readonly');
								tds += counter > 1 ? '<td class="align-center"><a class="dynamicDelete"><img src="images/dashboard/close-icon.svg" width="25"/></a></td>' : '<td></td>';
								$('#poDetailsEntryTable tbody').append('<tr>' + tds + '</tr>');
								initLastPOItemSelectors(poDetail.PartId, poDetail.VehicleModelId, null, poDetail.VehicleServiceTypeId);
								setTableCellInputValue('#poDetailsEntryTable .orderQty:last', poDetail.orderedQty);
								setTableCellInputValue('#poDetailsEntryTable .unitCost:last', unitCost);
								setTableCellInputValue('#poDetailsEntryTable .SGSTPercentage:last', poDetail.SGSTPercentage || poDetail.Part && poDetail.Part.sgst || 0);
								setTableCellInputValue('#poDetailsEntryTable .CGSTPercentage:last', poDetail.CGSTPercentage || poDetail.Part && poDetail.Part.cgst || 0);
								setTableCellInputValue('#poDetailsEntryTable .DiscountPercentage:last', poDetail.discountPercentage || 0);
								counter++;
							});
							computeTotalOrderCost();
						}
					} else {
						alert(response.message ? response.message : response.error);
					}
				});
			} else {
				alert(response.message ? response.message : response.error);
			}
			$('#addPoModal').modal('show');
		});
	});

	$('#poInfoTable').on('click', '.view-details', function (e) {
		var id = $(this).data('id');
		$.ajax({
			type: 'GET',
			url: path + '/api/po/' + id,
			headers: { 'X-AT-SessionToken': localStorage.sessionToken }
		}).done(function (response) {
			var poHeader = response.purchaseOrder;
			setPoHeaders(poHeader);
			$('#viewPoDetailModal #viewPoDetailTable').DataTable({
				ajax: {
					dataType: 'json',
					headers: { 'X-AT-SessionToken': localStorage.sessionToken },
					type: 'GET',
					url: path + '/api/po/' + id + '/details',
					dataSrc: function (data) {
						let results = data.results.map(result => {
							result.poNumber = poHeader.poNumber;
							result.branch = poHeader.Branch.name;
							return result;
						});
						return results;
					}
				},
				dom: '<"top-filters-3"lBf>rt<"bottom-filters-2"ip>',
				buttons: [
					{ extend: "copy" },
					{ extend: "excel", title: "PoDetail-List" },
					{ extend: 'pdfHtml5', orientation: 'landscape', pageSize: 'A4' }
				],
				searching: false,
				paging: false,
				info: false,
				bDestroy: true,
				stripeClasses: [],
				order: [[0, 'asc']],
				columnDefs: [
					{ defaultContent: '', targets: '_all' },
					{ visible: false, targets: [12, 13, 14] }
				],
				columns: [
					{ data: 'lineNo' },
					{
						data: 'Part',
						render: function (data, type, full, meta) {
							return data && data.name ? data.name : 'N/A';
						}
					},
					{
						data: 'VehicleServiceType',
						render: function (data, type, full, meta) {
							return data && data.serviceName ? data.serviceName : 'N/A';
						}
					},
					{
						data: 'VehicleModel',
						render: function (data, type, full, meta) {
							const vehicleModelBrandName = getVehicleBrandModelName(data);
							return vehicleModelBrandName ? vehicleModelBrandName : '-';
						}
					},
					{ data: 'orderedQty', class: 'align-right' },
					{ data: 'orderedCost', class: 'align-right' },
					// orderedGST = SGST amount + CGST amount (total GST saved on the detail row)
					{ data: 'orderedGST', class: 'align-right', defaultContent: '0' },
					{
						// GST % column: orderedGST / orderedCost * 100
						data: 'orderedGST',
						class: 'align-right',
						defaultContent: 0,
						render: function (data, type, full, meta) {
							let orderedCost = Number(full.orderedCost);
							let orderedGST = Number(full.orderedGST || full.orderedCostGst || 0);
							let percentage = (orderedGST && orderedCost) ? (orderedGST / orderedCost) * 100 : 0;
							return Math.round(percentage) + '%';
						}
					},
					{ data: 'receivedQty', class: 'align-right' },
					{ data: 'invoicedQty', class: 'align-right' },
					{ data: 'invoicedCost', class: 'align-right' },
					{ data: 'paidQty', class: 'align-right' },
					{ data: 'paidCost', class: 'align-right' },
					{ data: 'poNumber', class: 'align-right' },
					{ data: 'branch' },
					{
						data: null,
						render: function (data, type, full, meta) {
							let grnNos = data && data.InvStocks && data.InvStocks.map(x => x.grn) || [];
							return grnNos.join(', ');
						}
					}
				]
			});
		});
		$('#viewPoDetailModal').modal('show');
		$("#print-grn").attr('data-id', id);
		const accountConfig = localStorage.getItem('config') ? JSON.parse(localStorage.getItem('config')) : null;
		if (accountConfig && accountConfig.invConfig && accountConfig.invConfig.poPdf && accountConfig.invConfig.poPdf.rcvdDetails) {
			$("#print-grn").show();
		}
	});

	//#region functionality to print purchase order details
	$("#print-grn").on("click", function (event) {
		const id = $(this).attr('data-id');
		$.ajax({
			type: 'GET',
			url: path + '/api/po/detailedPdf/' + id,
			headers: { 'X-AT-SessionToken': localStorage.sessionToken }
		}).done(function (response) {
			if (response.result && response.result.success) {
				try {
					const fileUrl = `${window.path}${response.result.destUrl}`;
					const fileName = "purchase_order_details";
					const anchor = document.createElement("a");
					anchor.href = fileUrl;
					anchor.target = "_blank";
					anchor.download = fileName;
					document.body.appendChild(anchor);
					anchor.click();
					document.body.removeChild(anchor);
				} catch (error) {
					console.log("PDF downloading failed ", error);
				}
			} else {
				alert("PDF downloading failed");
				console.log("PDF downloading failed ", response.result.error);
			}
		});
	});
	//#endregion

	function setPoHeaders(jsonData) {
		$('.totalQtyToReceive').text(jsonData['orderedQty'] - jsonData['receivedQty']);
		$('.grandTotal').text(Number(jsonData['orderedCost']) + Number(jsonData['orderedGST'] || jsonData['orderedCostGst'] || 0));
		$('.poRemarks').text(jsonData['note'] ? jsonData['note'] : '');
		const poHeader = $('.po-header');
		const namesArray = [
			'poNumber', 'poStatus', { type: 'date', data: 'orderDate' },
			'poReceivedByUser', 'poReceivedByDate',
			['Branch', 'name'], ['Vendor', 'name'],
			['PoHeaderCreatedBy', 'username'], ['PoHeaderApprovedBy', 'username'],
			['PoHeaderVerifiedBy', 'username'],
			'orderedCost', 'orderedGST', 'orderedQty', 'receivedQty', ['JobCard', 'jobCardNo']
		];
		namesArray.forEach(name => {
			let className, text = '';
			if (Array.isArray(name)) {
				const model = name[0], attribute = name[1];
				className = model + '-' + attribute;
				text = jsonData[model] ? jsonData[model][attribute] : '-';
			} else if (typeof (name) === 'object') {
				className = name.data;
				const string = jsonData[className];
				if (string) {
					text = name.type === 'date' ? moment(string).format('DD/MM/YYYY hh:mm A') : string;
				} else {
					text = '-';
				}
			} else {
				className = name;
				text = jsonData[name] ? jsonData[name] : '-';
				if (name == 'poStatus') { text = getPoStatusName(poStatusList, jsonData[name]); }
				if (name == 'poReceivedByUser') {
					text = jsonData['user'] && Object.keys(jsonData['user']).length && jsonData['user']['receivedBy'] && jsonData['user']['receivedBy']['name'] ? jsonData['user']['receivedBy']['name'] : '-';
				}
				if (name == 'poReceivedByDate') {
					text = jsonData['user'] && Object.keys(jsonData['user']).length && jsonData['user']['receivedBy'] && jsonData['user']['receivedBy']['date'] ? moment(jsonData['user']['receivedBy']['date']).format('DD/MM/YYYY hh:mm A') : '-';
				}
			}
			poHeader.find('.' + className).text(text);
		});
	}

	$('#poInfoTable').on('click', '.delete', function (e) {
		e.preventDefault();
		if (!confirm('Are you sure to delete this Purchase Order?')) {
			return;
		}
		var ele = $(this);
		var id = ele.data('id');
		$.ajax({
			type: 'DELETE',
			url: path + '/api/po/delete/' + id,
			headers: { 'X-AT-SessionToken': localStorage.sessionToken }
		}).done(function (response) {
			if (response.success === true) {
				if (response.reload != undefined && response.reload === true) {
					poTable.ajax.reload();
				} else {
					poTable.row(ele.closest('tr')).remove().draw();
				}
			} else {
				alert(response.message ? response.message : response.error);
			}
		});
	});

	$('#poInfoTable').on('click', '.approve', function (e) {
		e.preventDefault();
		let ele = $(this);
		let id = ele.data('id');
		$('#poApproveModal .poHeaderId').val(id);
		$('#poApproveForm .form-group.note').addClass('hide');
		$('#apprStatus').val('').change();
		$('#poApproveForm .note-text').val('');
		$('#poApproveModal').modal('show');
	});

	$('#poInfoTable').on('click', '.verify', function (e) {
		e.preventDefault();
		let ele = $(this);
		let id = ele.data('id');
		$('#poVerifyModal .poHeaderId').val(id);
		$('#poVerifyForm .form-group.note').addClass('hide');
		$('#verifyStatus').val('').change();
		$('#poVerifyForm .note-text').val('');
		$('#poVerifyModal').modal('show');
	});

	$('#poInfoTable').on('click', '.cancel', function (e) {
		e.preventDefault();
		let ele = $(this);
		let id = ele.data('id');
		$('#poCancelModal .poHeaderId').val(id);
		$('#poCancelForm .note-text').val('');
		$('#poCancelModal').modal('show');
	});

	$('#poInfoTable').on('click', '.print-po', function (e) {
		e.preventDefault();
		var ele = $(this);
		var id = ele.data('id');
		$.ajax({
			type: 'GET',
			url: path + '/api/po/pdf/' + id,
			headers: { 'X-AT-SessionToken': localStorage.sessionToken }
		}).done(function (response) {
			if (response.success === true) {
				setTimeout(function () {
					window.open(path + response.url);
				}, 800);
			} else {
				alert('Error printing PO. Please contact helpdesk.');
				console.log(response);
			}
		});
	});

	$('#poInfoTable').on('click', '.receive', function (e) {
		e.preventDefault();
		var id = $(this).data('id');
		$.ajax({
			type: 'GET',
			url: path + '/api/po/' + id,
			headers: { 'X-AT-SessionToken': localStorage.sessionToken }
		}).done(function (response) {
			if (response.success === true) {
				var poHeader = response.purchaseOrder;
				setPoHeaders(poHeader);
				$('#poReceiveModal .poHeaderId').val(poHeader.id);
				$.ajax({
					type: 'GET',
					url: path + '/api/po/' + id + '/details',
					headers: { 'X-AT-SessionToken': localStorage.sessionToken }
				}).done(function (response) {
					if (response.success === true) {
						var poDetails = response.results;
						if (poDetails && Object.keys(poDetails).length > 0) {
							let tds = '';
							$('#poDetailsReceiveTable tbody').html('');
							for (const poDetail of poDetails) {
								if (!poDetail.Part) {
									continue;
								}
								const unitCost = Number(Number(poDetail.orderedCost) / parseInt(poDetail.orderedQty)).toFixed(2);
								const unitCostGst = Number(Number(poDetail.orderedGST || poDetail.orderedCostGst || 0) / parseInt(poDetail.orderedQty)).toFixed(2);
								let totalCost = parseInt(poDetail.orderedQty) * unitCost;
								let totalGst = parseInt(poDetail.orderedQty) * unitCostGst;
								tds = '<tr>';
								tds += getTableCellLabel(poDetail.Part.name);
								tds += getTableCellLabel(poDetail.orderedQty);
								tds += getTableCellLabel(unitCost);
								tds += getTableCellLabel(unitCostGst);
								tds += getTableCellLabel(getVehicleBrandModelName(poDetail.VehicleModel));
								tds += getTableCellInput('location', 'select');
								if (poDetail.Part.serialNumbered) {
									tds += getTableCellInput('serialNo', 'textarea');
								} else {
									tds += getTableCellLabel('N/A');
								}
								tds += getTableCellInput('receivedQty', 'number', "", poDetail.orderedQty);
								tds += getTableCellInput('totalCost', 'number', "", totalCost);
								tds += getTableCellInput('totalGst', 'number', "", totalGst);
								if (autoGenGrnNumber && autoGenGrnNumber == true) {
									tds += getTableCellInput('grn', 'number', 'readonly');
								} else {
									tds += getTableCellInput('grn', 'number');
								}
								tds += getTableCellInput('note');
								tds += getTableCellInput('receiptImages', 'file');
								tds += '<td style="display:none"><input type="hidden" class="id" value="' + poDetail.id + '"></td>';
								tds += '<td style="display:none"><input type="hidden" class="vehicleModel" value="' + (poDetail.VehicleModelId ? poDetail.VehicleModelId : "") + '"></td>';
								tds += '<td style="display:none"><input type="hidden" class="unitCost" value="' + unitCost + '"></td>';
								tds += '<td style="display:none"><input type="hidden" class="unitGst" value="' + unitCostGst + '"></td>';
								tds += '</tr>';
								$('#poDetailsReceiveTable tbody').append(tds);
							}
							fetchLocations(poHeader);
							$('#poReceiveForm #totalReceivedCost').text(inputElementsSum('#poReceiveForm .totalCost'));
							$('#poReceiveForm #totalReceivedQty').text(inputElementsSum('#poReceiveForm .receivedQty'));
							$('#poReceiveForm #totalReceivedCostGst').text(inputElementsSum('#poReceiveForm .totalGst'));
						}
					} else {
						alert(response.message ? response.message : response.error);
					}
				});
			} else {
				alert(response.message ? response.message : response.error);
			}
			$('#poReceiveModal').modal('show');
		});
	});

	$("#poInfoTable").on("click", ".create-invoice", (e) => {
		const poHeaderId = $(e.target).data("id");
		const includes = ["PoDetail", "Part", "VehicleServiceType", "PoInvoiceDetail"].map((model) => `include=${model}`);
		$.ajax(`${path}/api/po/${poHeaderId}?${includes.join("&")}&invoice-status=pending`, {
			dataType: "json",
			headers: {
				"X-AT-SessionToken": localStorage.getItem("sessionToken"),
			},
		}).done((data) => {
			if (!data.success) {
				alert("Error while fetching purchase order!", data.error || data.message);
			}
			const PoHeader = data.purchaseOrder;
			$("#invoiceCreateModal").modal("show", {
				PoHeader,
				poTable
			});
		});
	});

	$('#poDetailsReceiveTable').on('blur', '.receivedQty', function (e) {
		let unitCost = $(this).closest('tr').find('td input.unitCost').val();
		
		let unitGst = $(this).closest('tr').find('td input.unitGst').val();
		let receivedQty = parseInt($(this).val()) || 0;
		let totalCost = receivedQty * unitCost;
		let totalGst = receivedQty * unitGst;
		$(this).closest('tr').find('td input.totalCost').val(Number(totalCost).toFixed(2));
		$(this).closest('tr').find('td input.totalGst').val(Number(totalGst).toFixed(2));
		$('#poReceiveForm #totalReceivedCost').text(inputElementsSum('#poReceiveForm .totalCost'));
		$('#poReceiveForm #totalReceivedQty').text(inputElementsSum('#poReceiveForm .receivedQty'));
		$('#poReceiveForm #totalReceivedCostGst').text(inputElementsSum('#poReceiveForm .totalGst'));
	});

	function validateSerialNoCount(poDetails) {
		return poDetails.filter(x => x.serialNo && x.serialNo.length != x.receivedQty).length > 0;
	}

	$('#poReceiveForm').validate({
		submitHandler: function (form) {
			let formData = new FormData(form);
			var tempId = 0;
			let poDetails = [];
			const classOrJsonKeyNames = ['serialNo', 'receivedQty', 'totalCost', 'totalGst', 'location', 'vehicleModel', 'grn', 'note'];
			$('#poDetailsReceiveTable tbody tr').each(function () {
				let poDetail = getFormTableInputDataAsObject($(this), classOrJsonKeyNames);
				poDetail['id'] = $(this).find('td input.id').val();
				if ($(this).find('td select.location-select2').val() && $(this).find('td input.receivedQty').val() && $(this).find('td input.totalCost').val() && $(this).find('td input.totalGst').val()) {
					poDetails.push(poDetail);
					tempId += 1;
					var images = $(this).find('td input.receiptImages');
					if (images && images[0] && images[0].files[0]) {
						var originalFileName = images[0].files[0].name.substring(0, images[0].files[0].name.lastIndexOf('.'));
						var ext = images[0].files[0].name.substr(images[0].files[0].name.lastIndexOf('.') + 1);
						var tempName = originalFileName ? originalFileName + '_' + tempId + '.' + ext : '';
						formData.append('receiptImages', images[0].files[0], tempName);
					}
				}
			});

			var validateLocation, validateQty, validateCost, validateGst, validateGrn, grnStr;
			$('#poDetailsReceiveTable tbody tr').each(function () {
				if ($(this).find('td input.receivedQty').val() && $(this).find('td input.receivedQty').val() > 0) {
					validateLocation = $(this).find('td select.location-select2').val() ? false : true;
					validateQty = $(this).find('td input.receivedQty').val() ? false : true;
					validateCost = $(this).find('td input.totalCost').val() ? false : true;
					validateGst = $(this).find('td input.totalGst').val() ? false : true;
					grnStr = $(this).find('td input.grn').val();
					validateGrn = $(this).find('td input.grn').val() ? false : true;
				}
			});

			if (autoGenGrnNumber && autoGenGrnNumber == true) {
				if ((validateLocation || validateQty || validateCost || validateGst) || !poDetails.length) {
					return alert('Location, Qty and Cost are required!');
				}
			} else {
				if ((validateLocation || validateQty || validateCost || validateGst || validateGrn) || !poDetails.length) {
					return alert('Location, Qty, Cost and GRN are required!');
				}
				const grn = Number(grnStr);
				if (!Number.isInteger(grn) || grn < 0 || grn > Number.MAX_SAFE_INTEGER) {
					return alert('Invalid GRN Number!');
				}
			}
			if (validateSerialNoCount(poDetails)) {
				return alert('Serial Numbers count should be equal to Received Qty!');
			}

			formData.append("poDetails", JSON.stringify(poDetails));
			$('#savePoReceiveBtn').prop('disabled', true);
			$.ajax({
				type: $(form).attr('method'),
				url: path + '/api/po/receive/' + $('#poReceiveModal .poHeaderId').val(),
				data: formData,
				cache: false,
				contentType: false,
				processData: false,
				headers: { 'X-AT-SessionToken': localStorage.sessionToken }
			}).done(function (response) {
				if (response.success === true) {
					$('#poReceiveModal').modal('hide');
					poTable.ajax.reload();
				} else {
					alert(response.message ? response.message : response.error);
				}
				$('#savePoReceiveBtn').prop('disabled', false);
			});
			return false;
		}
	});

	$("#apprStatus").on("change", function (e) {
		const status = $('#apprStatus').val();
		if (status == '12') {
			$('#poApproveForm .form-group.note').removeClass('hide');
		} else {
			$('#poApproveForm .form-group.note').addClass('hide');
		}
	});

	$("#verifyStatus").on("change", function (e) {
		const status = $('#verifyStatus').val();
		if (status == '12') {
			$('#poVerifyForm .form-group.note').removeClass('hide');
		} else {
			$('#poVerifyForm .form-group.note').addClass('hide');
		}
	});

	$("#poEntryForm").on("change", ".branch-select2", function (e) {
		const selectedBranchId = $(this).val();
		initOnBranchSelect(selectedBranchId);
		$('.billTo, .shipTo').val(``);
		if ($(this).val()) {
			var branchName = $(this).select2("data")[0].text ? $(this).select2("data")[0].text : '';
			var branchAddress = $(this).select2("data")[0].address ? $(this).select2("data")[0].address : '';
			$('.billTo, .shipTo').val(`${branchName} \n${branchAddress}`);
		}
		//#endregion
	});

	function initOnBranchSelect(selectedBranchId) {
		let assignedParts = [];
		if (selectedBranchId) {
			assignedParts = getPartsAssignedToBranch(selectedBranchId, partsObjArray);
		}
		const assignedPartsSelect = assignedParts.length > 0 ? getDataForSelectInput(assignedParts) : parts;
		$("#poDetailsEntryTable .part-select2").empty().select2({
			theme: "classic",
			placeholder: "Select Part",
			data: assignedPartsSelect,
			allowClear: true,
		});
		$('#poDetailsEntryTable').find('td .part-select2').val(null).trigger('change.select2');
	}

	$("#poDetailsEntryTable").on("change", ".part-select2", (e) => {
		const target = $(e.target);
		if (!target.val()) {
			return;
		}
		const row = target.closest("tr");
		row.find(".vehicleServiceType-select2").val(null).trigger("change");
	});

	$("#poDetailsEntryTable").on("change", ".vehicleServiceType-select2", (e) => {
		const target = $(e.target);
		if (!target.val()) {
			return;
		}
		const row = target.closest("tr");
		row.find(".part-select2").val(null).trigger("change");
	});

	$("#poDetailsEntryTable").on("change", ".part-select2", function (e) {
		if (!$(".branch-select2").val()) {
			$(this).val(null).trigger('change.select2');
			return alert('Please select branch');
		}
		const selectedPartId = $(this).val();
		let assignedVehicleModels = [];
		if (selectedPartId) {
			assignedVehicleModels = getVehicleModelsAssignedToPart(selectedPartId, partsObjArray);
		}
		const assignedVehiclesSelect = assignedVehicleModels.length > 0 ? getDataForSelectInput(assignedVehicleModels, true) : vehicleModels;
		const vehicleModelSelectInput = $(this).closest('tr').find('td .vehicleModel-select2');
		if (vehicleModelSelectInput.length > 0) {
			vehicleModelSelectInput.empty().select2({
				theme: "classic",
				placeholder: "Select Vehicle Model",
				data: assignedVehiclesSelect,
				allowClear: true,
			});
			vehicleModelSelectInput.val(null).trigger('change.select2');
		}
		if ($(this).val()) {
			fetchStockDetatils(this);
		}
		clearContainerTableRowInputs(this);
		computeTotalOrderCost();
	});

	$("#poDetailsEntryTable").on("change", ".vehicleModel-select2", function (e) {
		if (!$(".branch-select2").val()) {
			$(this).val(null).trigger('change.select2');
			return alert('Please select branch');
		}
		const row = $(this).closest('tr');
		const partId = row.find('td select.part-select2').val();
		if (!partId) {
			$(this).val(null).trigger('change.select2');
			return alert('Please select part');
		}
		fetchStockDetatils(this);
	});

	
	function fetchStockDetatils(ele) {
		$(ele).closest('tr').find('td label.text-label').html('');
		$(ele).closest('tr').find('td input.unitCost').val('');
		$(ele).closest('tr').find('td input.taxlessTotal').val('');
		$(ele).closest('tr').find('td input.SGSTCost').val('');
		$(ele).closest('tr').find('td input.CGSTCost').val('');
		$(ele).closest('tr').find('td input.GST').val('');
		$(ele).closest('tr').find('td input.DiscountCost').val('');
		$(ele).closest('tr').find('td input.NetTotal').val('');
		var branchId = $(".branch-select2").val();
		var partId = $(ele).closest('tr').find('td select.part-select2').val();
		var vehicleModelId = $(ele).closest('tr').find('td select.vehicleModel-select2').val() || '';
		if (!partId || !branchId) {
			$(ele).closest('tr').find('td select.part-select2').val(null).trigger('change.select2');
			return alert('Please select branch & part');
		}
		$.ajax({
			type: 'GET',
			url: path + '/api/inventories/stocks/part?BranchId=' + branchId + '&PartId=' + partId + '&VehicleModelId=' + vehicleModelId,
			headers: { 'X-AT-SessionToken': localStorage.sessionToken }
		}).done(function (response) {
			if (response.success === true) {
				var partDetail = response.partDetail;
				var invStock = response.invStock;
				var minOrderQty = 0;
				var minQty = 0;
				var maxQty = 0;
				var availQty = 0;
				if (partDetail) {
					minOrderQty = partDetail.minOrderQty || 0;
					minQty = partDetail.minQty || 0;
					maxQty = partDetail.maxQty || 0;
					$(ele).closest('tr').find('.unitCost').val(partDetail.cost || '');
					$(ele).closest('tr').find('.SGSTPercentage').val(partDetail.sgst || 0);
					$(ele).closest('tr').find('.CGSTPercentage').val(partDetail.cgst || 0);
					computeTotalOrderCost();
				}
				if (invStock) {
					availQty = invStock.quantityOnHand || 0;
				}
				$(ele).closest('tr').find('td label.text-label').html(`Min Order Qty : ${minOrderQty} </br> Min/Max Qty : ${minQty} / ${maxQty} </br> Avail Qty : ${availQty}`);
			} else {
				alert(response.message ? response.message : response.error);
			}
		});
	}

	$('#poApproveForm').validate({
		submitHandler: function (form) {
			$('#savePoApproveBtn').prop('disabled', true);
			let selection = $('#apprStatus').val();
			let endpoint = '';
			switch (selection) {
				case '3': endpoint = 'approve/'; break;
				case '12': endpoint = 'reject/'; break;
				default: alert('Invalid selection!'); break;
			}
			$.ajax({
				type: $(form).attr('method'),
				url: path + $(form).attr('action') + endpoint + $('#poApproveModal .poHeaderId').val(),
				data: { note: $('#poApproveForm .note-text').val() },
				headers: { 'X-AT-SessionToken': localStorage.sessionToken }
			}).done(function (response) {
				if (response.success === true) {
					$('#poApproveModal').modal('hide');
					poTable.ajax.reload();
				} else {
					alert(response.message);
				}
				$('#savePoApproveBtn').prop('disabled', false);
			});
			return false;
		}
	});

	$('#poVerifyForm').validate({
		submitHandler: function (form) {
			$('#savePoVerifyBtn').prop('disabled', true);
			let selection = $('#verifyStatus').val();
			let endpoint = '';
			switch (selection) {
				case '2': endpoint = 'verify/'; break;
				case '12': endpoint = 'reject/'; break;
				default: alert('Invalid selection!'); break;
			}
			$.ajax({
				type: $(form).attr('method'),
				url: path + $(form).attr('action') + endpoint + $('#poVerifyModal .poHeaderId').val(),
				data: { note: $('#poVerifyForm .note-text').val() },
				headers: { 'X-AT-SessionToken': localStorage.sessionToken }
			}).done(function (response) {
				if (response.success === true) {
					$('#poVerifyModal').modal('hide');
					poTable.ajax.reload();
				} else {
					alert(response.message);
				}
				$('#savePoVerifyBtn').prop('disabled', false);
			});
			return false;
		}
	});

	$('#poCancelForm').validate({
		submitHandler: function (form) {
			$('#savePoCancelBtn').prop('disabled', true);
			$.ajax({
				type: $(form).attr('method'),
				url: path + $(form).attr('action') + $('#poCancelModal .poHeaderId').val(),
				data: { note: $('#poCancelForm .note-text').val() },
				headers: { 'X-AT-SessionToken': localStorage.sessionToken }
			}).done(function (response) {
				if (response.success === true) {
					$('#poCancelModal').modal('hide');
					poTable.ajax.reload();
				} else {
					alert(response.message);
				}
				$('#savePoCancelBtn').prop('disabled', false);
			});
			return false;
		}
	});

	$("#sdate").datetimepicker({ format: "DD/MM/YYYY", sideBySide: true });
	$("#edate").datetimepicker({ format: "DD/MM/YYYY", sideBySide: true });
	$("#sdate").data("DateTimePicker").defaultDate(moment(moment().subtract(1, 'month')));
	$("#edate").data("DateTimePicker").defaultDate(moment());

	$("#loadFilter").on("click", function (e) {
		e.preventDefault();
		$('#loadFilter').prop('disabled', true);
		loadPoTable();
		$('#loadFilter').prop('disabled', false);
	});

	var poTable;
	function loadPoTable() {
		let sdate = $("#sdate").data("DateTimePicker").date();
		let edate = $("#edate").data("DateTimePicker").date();
		let encodeSDate = sdate.toISOString();
		let encodeEDate = edate.toISOString();
		let branch = $("#branch-filter").val() || '';
		let vendor = $("#vendor-filter").val() || '';
		let status = $("#status-filter").val() || '';
		let url = path + `/api/po/list?branch=${branch}&vendor=${vendor}&status=${status}&sdate=${encodeSDate}&edate=${encodeEDate}`;
		if (poTable == undefined) {
			poTable = $('#poInfoTable').DataTable({
				ajax: {
					dataType: 'json',
					headers: { 'X-AT-SessionToken': localStorage.sessionToken },
					type: 'GET',
					url: url,
					dataSrc: function (response) {
						return response.results || [];
					}
				},
				dom: '<"top-filters-3"lBf>rt<"bottom-filters-2"ip>',
				buttons: [
					{ extend: "copy" },
					{ extend: "excel", title: "PO-List" },
					{ extend: 'pdfHtml5', orientation: 'landscape', title: "Purchase Orders", pageSize: 'A4' }
				],
				lengthMenu: [[20, 40, 60, -1], [20, 40, 60, 'All']],
				fixedColumns: { leftColumns: 1, rightColumns: 1 },
				scrollX: true,
				scrollY: true,
				columns: [
					{ data: 'poNumber' },
					{
						data: 'JobCard',
						class: 'align-right',
						render: function (data, type, full, meta) {
							return data ? data.jobCardNo : '';
						}
					},
					{
						data: 'PoDetails',
						class: 'align-right',
						render: function (data, type, full, meta) {
							let grnSet = new Set();
							if (data) {
								data.forEach(poDetail => {
									if (poDetail.PoReceipts) {
										poDetail.PoReceipts.forEach(receipt => {
											grnSet.add(receipt.grn);
										});
									}
								});
							}
							return Array.from(grnSet).join(', ');
						}
					},
					{
						data: 'orderDate',
						class: 'align-center',
						render: function (data, type, full, meta) {
							if (!data) { return ""; }
							if (type === 'display' || type === 'filter') {
								return moment(data).format('DD/MM/YYYY hh:mm A');
							}
							return moment(data).unix();
						}
					},
					{
						data: 'orderedCost',
						class: 'align-right',
						render: function (data, type, full, meta) {
							return data ? Number(data).toFixed(2) : '0.00';
						}
					},
					{
						data: 'NetTotal',
						class: 'align-right',
						render: function (data, type, full, meta) {
							return data ? Number(data).toFixed(2) : '0.00';
						}
					},
					{
						data: 'Branch',
						defaultContent: '',
						render: function (data, type, full, meta) {
							return data && data.name ? data.name : 'N/A';
						}
					},
					{
						data: 'Vendor',
						defaultContent: '',
						render: function (data, type, full, meta) {
							return data && data.name ? data.name : 'N/A';
						}
					},
					{
						data: 'poStatus',
						class: 'align-center',
						render: function (data, type, full, meta) {
							return '<span class="label ' + poStatusForClass(data) + '">' + (poStatusList.length ? getPoStatusName(poStatusList, data) : '') + '</span>';
						}
					},
					{
						data: 'createdAt',
						name: "createdAt",
						class: 'align-center',
						render: function (data, type, full, meta) {
							if (!data) { return ""; }
							const createdAt = moment(data);
							if (!(type == "display" || type == "filter")) {
								return createdAt.unix();
							}
							return (full.PoHeaderCreatedBy ? (full.PoHeaderCreatedBy.username || '') : '') + ' </br>' + moment(data).format('DD/MM/YYYY hh:mm A');
						}
					},
					{
						data: 'verifiedAt',
						class: 'align-center',
						defaultContent: '',
						render: function (data, type, full, meta) {
							if (!data) { return ""; }
							const verifiedAt = moment(data);
							if (!(type == "display" || type == "filter")) {
								return verifiedAt.unix();
							}
							return (full.PoHeaderVerifiedBy ? (full.PoHeaderVerifiedBy.username || '') : '') + ' </br>' + moment(data).format('DD/MM/YYYY hh:mm A');
						}
					},
					{
						data: 'approvedAt',
						class: 'align-center',
						defaultContent: '',
						render: function (data, type, full, meta) {
							if (!data) { return ""; }
							const approvedAt = moment(data);
							if (!(type == "display" || type == "filter")) {
								return approvedAt.unix();
							}
							return (full.PoHeaderApprovedBy ? (full.PoHeaderApprovedBy.username || '') : '') + ' </br>' + moment(data).format('DD/MM/YYYY hh:mm A');
						}
					},
					{
						data: 'userDetails',
						defaultContent: '',
						class: 'align-center',
						render: function (data, type, full, meta) {
							if (data && data['4']) {
								if (type === 'display' || type == 'filter') {
									return (data['4'].username) + ' </br>' + moment(data['4'].date).format('DD/MM/YYYY hh:mm A');
								} else {
									return data['4'].date;
								}
							}
						}
					},
					{
						data: 'note',
						defaultContent: '',
						render: function (data, type, full, meta) {
							return data;
						}
					},
					{
						data: null,
						targets: -1,
						orderable: false,
						render: function (data, type, full, meta) {
							var allButtons = [];
							if (full.poStatus < 3) {
								allButtons.push(getEditButton(data));
							}
							if (data) {
								if (data.addressInfo) { delete data.addressInfo; }
								if (data.Vendor) { delete data.Vendor; }
								if (data.Branch) { delete data.Branch; }
							}
							allButtons.push(`<a data-id="${data.id}" data-json=${JSON.stringify(data)} class="view-details btn btn-default btn-xs" style="margin-right: 3px;margin-bottom: 3px;">View Details</a>`);
							if (full.poStatus == 1 || full.poStatus == 12) {
								allButtons.push(getVerifyButton(data));
							}
							if (full.poStatus == 2) {
								allButtons.push(getApproveButton(data));
							}
							if (full.poStatus == 3) {
								allButtons.push(getCancelButton(data));
							}
							if (full.poStatus == 3 || full.poStatus == 6) {
								if (getComponentAccess('Receive')) {
									allButtons.push(`<a data-id="${data.id}" data-json=${JSON.stringify(data)} class="receive btn btn-default btn-xs" style="margin-right: 3px;margin-bottom: 3px;">Receive</a>`);
								}
								allButtons.push(`<a data-id="${data.id}" data-json=${JSON.stringify(data)} class="print-po btn btn-default btn-xs" style="margin-right: 3px;margin-bottom: 3px;">Print PO</a>`);
							} else if (full.poStatus >= 3 && full.poStatus != 4 && ['2144', '10152'].includes(localStorage.AccountId)) {
								allButtons.push(`<a data-id="${data.id}" data-json=${JSON.stringify(data)} class="print-po btn btn-default btn-xs" style="margin-right: 3px;margin-bottom: 3px;">Print PO</a>`);
							}
							if (full.poStatus >= 6) {
								allButtons.push(`<a data-id="${data.id}" class="create-invoice btn btn-default btn-xs" style="margin-right: 3px;margin-bottom: 3px;">Create Invoice</a>`);
							}
							if (full.PoInvoiceHeaders && full.PoInvoiceHeaders.length) {
								allButtons.push(`<a data-id="${data.id}" class="view-invoices btn btn-default btn-xs" style="margin-right: 3px;margin-bottom: 3px;" href="po-invoices?PoHeaderId=${full.id}" target="__blank">View Invoices</a>`);
							}
							allButtons.push(generateDataImageButton(data.images));
							allButtons.push(getDeleteButton(data));

							var buttons = "";
							if (allButtons.length) {
								var i = 0;
								allButtons.forEach(function (button) {
									buttons += button;
									buttons += (i + 1) % 3 == 0 ? '<br>' : '';
									i += 1;
								});
							}
							return buttons;
						}
					}
				],
				initComplete: function () {
					let instance = this.api();
					let orderByColIdx = instance.column('createdAt:name').index();
					instance.order([[orderByColIdx, 'desc']]).draw();
				}
			});
		} else {
			poTable.ajax.url(url).load();
		}
	}

	$('#poInfoTable_wrapper .dataTables_length select').addClass('form-control xsmall');

	$('#poEntryForm').validate({
		submitHandler: function (form) {
			let poDetailsValidationMsg = "";
			$("#poDetailsEntryTable tbody tr").each(function (idx) {
				const row = $(this);
				const partId = row.find("td select.part-select2").val();
				const vehicleServiceTypeId = row.find("td select.vehicleServiceType-select2").val();
				if (!(partId || vehicleServiceTypeId)) {
					poDetailsValidationMsg = `No part or service is selected for row ${idx + 1}`;
					return false;
				}
			});
			if (poDetailsValidationMsg) {
				return alert(poDetailsValidationMsg);
			}

			let addFormData = new FormData(form);
			let poDetails = [];

			$('#poDetailsEntryTable tbody tr').each(function () {
				let poDetail = {
					partId: $(this).find('td select.part-select2').val() || '',
					vehicleModelId: $(this).find('td select.vehicleModel-select2').val() || '',
					vehicleServiceTypeId: $(this).find('td select.vehicleServiceType-select2').val() || '',
					orderedQty: $(this).find('td input.orderQty').val() || '',
					unitCost: $(this).find('td input.unitCost').val() || '',
					taxlessTotal: $(this).find('td input.taxlessTotal').val() || '',
					SGSTPercentage: $(this).find('td input.SGSTPercentage').val() || '',
					SGSTCost: $(this).find('td input.SGSTCost').val() || '',
					CGSTPercentage: $(this).find('td input.CGSTPercentage').val() || '',
					CGSTCost: $(this).find('td input.CGSTCost').val() || '',
					GST: $(this).find('td input.GST').val() || '',
					DiscountPercentage: $(this).find('td input.DiscountPercentage').val() || '',
					DiscountCost: $(this).find('td input.DiscountCost').val() || '',
					NetTotal: $(this).find('td input.NetTotal').val() || '',
				};
				poDetails.push(poDetail);
			});
			addFormData.append("poDetails", JSON.stringify(poDetails));

			$('#savePoEntryBtn').prop('disabled', true);
			var method = "POST";
			var url = '/api/po/create/';
			if ($('#poEntryForm .poHeaderId').val() != "new" || $('#poEntryForm .poHeaderId').val() > 0) {
				method = "PUT";
				url = '/api/po/update/' + $('#poEntryForm .poHeaderId').val();
			}
			$.ajax({
				type: method,
				url: path + url,
				data: addFormData,
				cache: false,
				contentType: false,
				processData: false,
				headers: { 'X-AT-SessionToken': localStorage.sessionToken }
			}).done(function (response) {
				if (response.success === true) {
					poTable.ajax.reload();
					$('#addPoModal').modal('hide');
				} else {
					alert(response.message ? response.message : response.error);
				}
				$('#savePoEntryBtn').prop('disabled', false);
			});
			return false;
		}
	});
});

$('#poReceiveForm').on('change keyup blur', ".totalCost", function () {
	$('#poReceiveForm #totalReceivedCost').text(inputElementsSum('#poReceiveForm .totalCost'));
});

$('#poReceiveForm').on('change keyup blur', ".receivedQty", function () {
	$('#poReceiveForm #totalReceivedQty').text(inputElementsSum('#poReceiveForm .receivedQty'));
});

$('#poReceiveForm').on('change keyup blur', ".totalGst", function () {
	$('#poReceiveForm #totalReceivedCostGst').text(inputElementsSum('#poReceiveForm .totalGst'));
});

$('#poEntryForm').on('change keyup blur', '.orderQty, .unitCost, .SGSTPercentage, .CGSTPercentage, .DiscountPercentage', computeTotalOrderCost);

function computeTotalOrderCost() {
	let taxlessTotal = 0;
	let totalGst = 0;
	let discountTotal = 0;
	let netGrandTotal = 0;

	$('#poDetailsEntryTable tbody tr').each(function () {
		let row = $(this);
		let qty = parseFloat(row.find('.orderQty').val()) || 0;
		let unitCost = parseFloat(row.find('.unitCost').val()) || 0;
		let sgstPercent = parseFloat(row.find('.SGSTPercentage').val()) || 0;
		let cgstPercent = parseFloat(row.find('.CGSTPercentage').val()) || 0;
		let discountPercent = parseFloat(row.find('.DiscountPercentage').val()) || 0;

		let taxless = qty * unitCost;
		let sgstAmount = taxless * sgstPercent / 100;
		let cgstAmount = taxless * cgstPercent / 100;
		let gstTotal = sgstAmount + cgstAmount;
		let discountAmount = taxless * discountPercent / 100;
		let netTotal = taxless + gstTotal - discountAmount;

		row.find('.taxlessTotal').val(taxless.toFixed(2));
		row.find('.SGSTCost').val(sgstAmount.toFixed(2));
		row.find('.CGSTCost').val(cgstAmount.toFixed(2));
		row.find('.GST').val(gstTotal.toFixed(2));
		row.find('.DiscountCost').val(discountAmount.toFixed(2));
		row.find('.NetTotal').val(netTotal.toFixed(2));

		taxlessTotal += taxless;
		totalGst += gstTotal;
		discountTotal += discountAmount;
		netGrandTotal += netTotal;
	});

	$('#poEntryForm #orderedTaxless').text(taxlessTotal.toFixed(2));
	$('#poEntryForm .orderedTaxless').val(taxlessTotal.toFixed(2));
	$('#poEntryForm #orderedGST').text(totalGst.toFixed(2));
	$('#poEntryForm .orderedGST').val(totalGst.toFixed(2));
	$('#poEntryForm #orderedDiscount').text(discountTotal.toFixed(2));
	$('#poEntryForm .orderedDiscount').val(discountTotal.toFixed(2));
	$('#poEntryForm #grandTotal').text(netGrandTotal.toFixed(2));
	$('#poEntryForm .grandTotal').val(netGrandTotal.toFixed(2));
}

function getAddPoDetailTableRowHtml(noDynamicDelete) {
	let tds = '';
	tds = getTableCellInput('part', 'select');
	tds += getTableCellInput("vehicleServiceType", "select");
	tds += getTableCellInput('vehicleModel', 'select');
	tds += getTableCellLabel('', 12);
	tds += getTableCellInput('orderQty', 'number', true);
	tds += getTableCellInput('unitCost', 'number', true);
	tds += getTableCellInput('taxlessTotal', 'number', 'readonly');
	tds += getTableCellInput('SGSTPercentage', 'number');
	tds += getTableCellInput('SGSTCost', 'number', 'readonly');
	tds += getTableCellInput('CGSTPercentage', 'number');
	tds += getTableCellInput('CGSTCost', 'number', 'readonly');
	tds += getTableCellInput('GST', 'number', 'readonly');
	tds += getTableCellInput('DiscountPercentage', 'number');
	tds += getTableCellInput('DiscountCost', 'number', 'readonly');
	tds += getTableCellInput('NetTotal', 'number', 'readonly');
	if (!noDynamicDelete) {
		tds += '<td class="align-center"><a class="dynamicDelete"><img src="images/dashboard/close-icon.svg" width="25"/></a></td>';
	} else {
		tds += '<td></td>';
	}
	return '<tr>' + tds + '</tr>';
}

function poStatusForClass(id) {
	const statusClass = [
		{ "id": 1, "class": "loading" },
		{ "id": 2, "class": "warning" },
		{ "id": 3, "class": "success" },
		{ "id": 4, "class": "danger" },
		{ "id": 5, "class": "success" },
		{ "id": 6, "class": "success" },
		{ "id": 7, "class": "success" },
		{ "id": 8, "class": "success" },
		{ "id": 9, "class": "success" },
		{ "id": 10, "class": "success" },
		{ "id": 11, "class": "success" },
		{ "id": 12, "class": "danger" }
	];
	const classMatch = statusClass.find(x => x.id == id);
	return classMatch && classMatch.class ? 'label-' + classMatch.class : '';
}

function getPoStatusName(poStatusList, id) {
	const poStatusObj = poStatusList.find(x => x.id == id);
	return poStatusObj && poStatusObj.text;
}

function populateLocationSelection(branchId, locationId) {
	$('.po-location-select2').empty();
	var partLocations = scope.locations ? scope.locations.filter(x => x.BranchId == branchId) : [];
	$('.po-location-select2').select2({
		theme: 'classic',
		placeholder: 'Select Location',
		data: partLocations,
		allowClear: true,
	});
	$('.po-location-select2').val(locationId ? locationId : null).trigger('change');
}

function fetchLocations(poHeader) {
	$.ajax({
		type: 'GET',
		url: path + '/api/inventories/locations?status=true',
		headers: { 'X-AT-SessionToken': localStorage.sessionToken }
	}).done(function (response) {
		if (response.success === true) {
			var results = response.results.map(function (obj) {
				var rObj = {};
				rObj.id = obj.id;
				rObj.text = obj.name;
				rObj.BranchId = obj.BranchId;
				return rObj;
			});
			var branchLocations = results.filter(x => x.BranchId == poHeader.BranchId);
			if (poHeader.LocationId) {
				branchLocations = branchLocations.filter(x => x.id == poHeader.LocationId);
			}
			$('#poDetailsReceiveTable .location-select2').select2({
				theme: 'classic',
				placeholder: 'Select Location',
				data: branchLocations,
				allowClear: true,
			});
		} else {
			alert(response.message ? response.message : response.error);
		}
	});
}

var scope = this;
