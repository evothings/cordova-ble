;(function()
{

// Functions that will be included in the BLE plugin API.

window.evothings = window.evothings || {}

window.evothings.newble = {}

window.evothings.newble.foo = 'bar'

hyper.log('foo has value: ' + window.evothings.newble.foo)

evothings.newble.getService = function(services, uuid)
{
	for (var i in services)
	{
		var service = services[i]
		if (service.uuid == uuid)
		{
			return service
		}
	}
	
	return null
}

evothings.newble.getCharacteristic = function(characteristics, uuid)
{
	for (var i in characteristics)
	{
		var characteristic = characteristics[i]
		if (characteristic.uuid == uuid)
		{
			return characteristic
		}
	}
	
	return null
}

evothings.newble.getDescriptor = function(descriptors, uuid)
{
	for (var i in descriptors)
	{
		var descriptor = descriptors[i]
		if (descriptor.uuid == uuid)
		{
			return descriptor
		}
	}
	
	return null
}


var base64

/**
 * If device already has advertisementData, does nothing.
 * If device instead has scanRecord, creates advertisementData.
 * See ble.js for AdvertisementData reference.
 * @param device - Device object.
 */
evothings.newble.ensureAdvertisementData = function(device)
{
	if (!base64) { base64 = cordova.require('cordova/base64'); }

	// If device object already has advertisementData we
	// do not need to parse the scanRecord.
	if (device.advertisementData) { return; }

	// Must have scanRecord yo continue.
	if (!device.scanRecord) { return; }

	// Here we parse BLE/GAP Scan Response Data.
	// See the Bluetooth Specification, v4.0, Volume 3, Part C, Section 11,
	// for details.

	var byteArray = evothings.newble.base64DecToArr(device.scanRecord);
	var pos = 0;
	var advertisementData = {};
	var serviceUUIDs;
	var serviceData;

	// The scan record is a list of structures.
	// Each structure has a length byte, a type byte, and (length-1) data bytes.
	// The format of the data bytes depends on the type.
	// Malformed scanRecords will likely cause an exception in this function.
	while (pos < byteArray.length)
	{
		var length = byteArray[pos++];
		if (length == 0)
		{
			break;
		}
		length -= 1;
		var type = byteArray[pos++];

		// Parse types we know and care about.
		// Skip other types.

		var BLUETOOTH_BASE_UUID = '-0000-1000-8000-00805f9b34fb'

		// Convert 16-byte Uint8Array to RFC-4122-formatted UUID.
		function arrayToUUID(array, offset)
		{
			var k=0;
			var string = '';
			var UUID_format = [4, 2, 2, 2, 6];
			for (var l=0; l<UUID_format.length; l++)
			{
				if (l != 0)
				{
					string += '-';
				}
				for (var j=0; j<UUID_format[l]; j++, k++)
				{
					string += evothings.newble.toHexString(array[offset+k], 1);
				}
			}
			return string;
		}

		if (type == 0x02 || type == 0x03) // 16-bit Service Class UUIDs.
		{
			serviceUUIDs = serviceUUIDs ? serviceUUIDs : [];
			for(var i=0; i<length; i+=2)
			{
				serviceUUIDs.push(
					'0000' +
					evothings.newble.toHexString(
						evothings.newble.littleEndianToUint16(byteArray, pos + i),
						2) +
					BLUETOOTH_BASE_UUID);
			}
		}
		if (type == 0x04 || type == 0x05) // 32-bit Service Class UUIDs.
		{
			serviceUUIDs = serviceUUIDs ? serviceUUIDs : [];
			for (var i=0; i<length; i+=4)
			{
				serviceUUIDs.push(
					evothings.newble.toHexString(
						evothings.newble.littleEndianToUint32(byteArray, pos + i),
						4) +
					BLUETOOTH_BASE_UUID);
			}
		}
		if (type == 0x06 || type == 0x07) // 128-bit Service Class UUIDs.
		{
			serviceUUIDs = serviceUUIDs ? serviceUUIDs : [];
			for (var i=0; i<length; i+=16)
			{
				serviceUUIDs.push(arrayToUUID(byteArray, pos + i));
			}
		}
		if (type == 0x08 || type == 0x09) // Local Name.
		{
			advertisementData.kCBAdvDataLocalName = evothings.newble.fromUtf8(
				new Uint8Array(byteArray.buffer, pos, length));
		}
		if (type == 0x0a) // TX Power Level.
		{
			advertisementData.kCBAdvDataTxPowerLevel =
				evothings.newble.littleEndianToInt8(byteArray, pos);
		}
		if (type == 0x16) // Service Data, 16-bit UUID.
		{
			serviceData = serviceData ? serviceData : {};
			var uuid =
				'0000' +
				evothings.newble.toHexString(
					evothings.newble.littleEndianToUint16(byteArray, pos),
					2) +
				BLUETOOTH_BASE_UUID;
			var data = new Uint8Array(byteArray.buffer, pos+2, length-2);
			serviceData[uuid] = base64.fromArrayBuffer(data);
		}
		if (type == 0x20) // Service Data, 32-bit UUID.
		{
			serviceData = serviceData ? serviceData : {};
			var uuid =
				evothings.newble.toHexString(
					evothings.newble.littleEndianToUint32(byteArray, pos),
					4) +
				BLUETOOTH_BASE_UUID;
			var data = new Uint8Array(byteArray.buffer, pos+4, length-4);
			serviceData[uuid] = base64.fromArrayBuffer(data);
		}
		if (type == 0x21) // Service Data, 128-bit UUID.
		{
			serviceData = serviceData ? serviceData : {};
			var uuid = arrayToUUID(byteArray, pos);
			var data = new Uint8Array(byteArray.buffer, pos+16, length-16);
			serviceData[uuid] = base64.fromArrayBuffer(data);
		}
		if (type == 0xff) // Manufacturer-specific Data.
		{
			// Annoying to have to transform base64 back and forth,
			// but it has to be done in order to maintain the API.
			advertisementData.kCBAdvDataManufacturerData =
				base64.fromArrayBuffer(new Uint8Array(byteArray.buffer, pos, length));
		}

		pos += length;
	}
	advertisementData.kCBAdvDataServiceUUIDs = serviceUUIDs;
	advertisementData.kCBAdvDataServiceData = serviceData;
	device.advertisementData = advertisementData;

	/*
	// Log raw data for debugging purposes.

	console.log("scanRecord: "+evothings.util.typedArrayToHexString(byteArray));

	console.log(JSON.stringify(advertisementData));
	*/
}

/**
 * Decodes a Base64 string. Returns a Uint8Array.
 * nBlocksSize is optional.
 * @param {String} sBase64
 * @param {int} nBlocksSize
 * @return {Uint8Array}
 * @public
 */
evothings.newble.base64DecToArr = function(sBase64, nBlocksSize) {
	var sB64Enc = sBase64.replace(/[^A-Za-z0-9\+\/]/g, "");
	var nInLen = sB64Enc.length;
	var nOutLen = nBlocksSize ?
		Math.ceil((nInLen * 3 + 1 >> 2) / nBlocksSize) * nBlocksSize
		: nInLen * 3 + 1 >> 2;
	var taBytes = new Uint8Array(nOutLen);

	for (var nMod3, nMod4, nUint24 = 0, nOutIdx = 0, nInIdx = 0; nInIdx < nInLen; nInIdx++) {
		nMod4 = nInIdx & 3;
		nUint24 |= b64ToUint6(sB64Enc.charCodeAt(nInIdx)) << 18 - 6 * nMod4;
		if (nMod4 === 3 || nInLen - nInIdx === 1) {
			for (nMod3 = 0; nMod3 < 3 && nOutIdx < nOutLen; nMod3++, nOutIdx++) {
				taBytes[nOutIdx] = nUint24 >>> (16 >>> nMod3 & 24) & 255;
			}
			nUint24 = 0;
		}
	}

	return taBytes;
}

/**
 * Returns the integer i in hexadecimal string form,
 * with leading zeroes, such that
 * the resulting string is at least byteCount*2 characters long.
 * @param {int} i
 * @param {int} byteCount
 * @public
 */
evothings.newble.toHexString = function(i, byteCount) {
	var string = (new Number(i)).toString(16);
	while(string.length < byteCount*2) {
		string = '0'+string;
	}
	return string;
}

/**
 * Interpret byte buffer as unsigned little endian 16 bit integer.
 * Returns converted number.
 * @param {ArrayBuffer} data - Input buffer.
 * @param {number} offset - Start of data.
 * @return Converted number.
 * @public
 */
evothings.newble.littleEndianToUint16 = function(data, offset)
{
	return (evothings.newble.littleEndianToUint8(data, offset + 1) << 8) +
		evothings.newble.littleEndianToUint8(data, offset)
}

/**
 * Interpret byte buffer as unsigned little endian 32 bit integer.
 * Returns converted number.
 * @param {ArrayBuffer} data - Input buffer.
 * @param {number} offset - Start of data.
 * @return Converted number.
 * @public
 */
evothings.newble.littleEndianToUint32 = function(data, offset)
{
	return (evothings.newble.littleEndianToUint8(data, offset + 3) << 24) +
		(evothings.newble.littleEndianToUint8(data, offset + 2) << 16) +
		(evothings.newble.littleEndianToUint8(data, offset + 1) << 8) +
		evothings.newble.littleEndianToUint8(data, offset)
}

/**
 * Interpret byte buffer as little endian 8 bit integer.
 * Returns converted number.
 * @param {ArrayBuffer} data - Input buffer.
 * @param {number} offset - Start of data.
 * @return Converted number.
 * @public
 */
evothings.newble.littleEndianToInt8 = function(data, offset)
{
	var x = evothings.newble.littleEndianToUint8(data, offset)
	if (x & 0x80) x = x - 256
	return x
}

/**
 * Interpret byte buffer as unsigned little endian 8 bit integer.
 * Returns converted number.
 * @param {ArrayBuffer} data - Input buffer.
 * @param {number} offset - Start of data.
 * @return Converted number.
 * @public
 */
evothings.newble.littleEndianToUint8 = function(data, offset)
{
	return data[offset]
}

})();
