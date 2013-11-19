package com.evothings;

import org.apache.cordova.*;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import android.bluetooth.*;
import android.bluetooth.BluetoothAdapter.LeScanCallback;
import android.content.*;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.io.UnsupportedEncodingException;

public class BLE extends CordovaPlugin implements LeScanCallback {
	private CallbackContext mScanCallbackContext;
	private CallbackContext mResetCallbackContext;
	private Context mContext;

	int mNextGattHandle = 1;
	HashMap<Integer, GattHandler> mGatt = null;

	@Override
	public void initialize(final CordovaInterface cordova, CordovaWebView webView) {
		super.initialize(cordova, webView);
		mContext = webView.getContext();

		mContext.registerReceiver(new BluetoothStateReceiver(), new IntentFilter(BluetoothAdapter.ACTION_STATE_CHANGED));
	}

	@Override
	public boolean execute(String action, CordovaArgs args, final CallbackContext callbackContext)
		throws JSONException
	{
		if("startScan".equals(action)) { startScan(args, callbackContext); return true; }
		else if("stopScan".equals(action)) { stopScan(args, callbackContext); return true; }
		else if("connect".equals(action)) { connect(args, callbackContext); return true; }
		else if("rssi".equals(action)) { rssi(args, callbackContext); return true; }
		else if("services".equals(action)) { services(args, callbackContext); return true; }
		else if("characteristics".equals(action)) { characteristics(args, callbackContext); return true; }
		else if("descriptors".equals(action)) { descriptors(args, callbackContext); return true; }
		else if("readCharacteristic".equals(action)) { readCharacteristic(args, callbackContext); return true; }
		else if("readDescriptor".equals(action)) { readDescriptor(args, callbackContext); return true; }
		else if("writeCharacteristic".equals(action)) { writeCharacteristic(args, callbackContext); return true; }
		else if("writeDescriptor".equals(action)) { writeDescriptor(args, callbackContext); return true; }
		else if("enableNotification".equals(action)) { enableNotification(args, callbackContext); return true; }
		else if("disableNotification".equals(action)) { disableNotification(args, callbackContext); return true; }
		else if("testCharConversion".equals(action)) { testCharConversion(args, callbackContext); return true; }
		else if("reset".equals(action)) { reset(args, callbackContext); return true; }
		return false;
	}

	private void keepCallback(final CallbackContext callbackContext, JSONObject message) {
		PluginResult r = new PluginResult(PluginResult.Status.OK, message);
		r.setKeepCallback(true);
		callbackContext.sendPluginResult(r);
	}

	private void keepCallback(final CallbackContext callbackContext, String message) {
		PluginResult r = new PluginResult(PluginResult.Status.OK, message);
		r.setKeepCallback(true);
		callbackContext.sendPluginResult(r);
	}

	private void keepCallback(final CallbackContext callbackContext, byte[] message) {
		PluginResult r = new PluginResult(PluginResult.Status.OK, message);
		r.setKeepCallback(true);
		callbackContext.sendPluginResult(r);
	}

	private void startScan(final CordovaArgs args, final CallbackContext callbackContext) {
		//try {
			BluetoothAdapter adapter = BluetoothAdapter.getDefaultAdapter();
			if(!adapter.startLeScan(this)) {
				callbackContext.error("startLeScan failed.");
				return;
			}
			mScanCallbackContext = callbackContext;
		//}
			/*catch(Exception e) {
			callbackContext.error(e.toString());
		}*/
	}

	public void onLeScan(BluetoothDevice device, int rssi, byte[] scanRecord) {
		if(mScanCallbackContext == null) {
			return;
		}
		try {
			System.out.println("onLeScan "+device.getAddress()+" "+rssi+" "+device.getName());
			JSONObject o = new JSONObject();
			o.put("address", device.getAddress());
			o.put("rssi", rssi);
			o.put("name", device.getName());
			o.put("scanRecord", new String(scanRecord, "ISO-8859-1"));
			keepCallback(mScanCallbackContext, o);
		} catch(JSONException e) {
			mScanCallbackContext.error(e.toString());
		} catch(UnsupportedEncodingException e) {
			mScanCallbackContext.error(e.toString());
		}
	}

	private void stopScan(final CordovaArgs args, final CallbackContext callbackContext) {
		BluetoothAdapter adapter = BluetoothAdapter.getDefaultAdapter();
		adapter.stopLeScan(this);
		mScanCallbackContext = null;
	}

	private void connect(final CordovaArgs args, final CallbackContext callbackContext) {
		try {
			GattHandler gh = new GattHandler(mNextGattHandle, callbackContext);
			gh.mGatt = BluetoothAdapter.getDefaultAdapter().
				getRemoteDevice(args.getString(0)).connectGatt(mContext, true, gh);
			if(mGatt == null)
				mGatt = new HashMap<Integer, GattHandler>();
			Object res = mGatt.put(mNextGattHandle, gh);
			assert(res == null);
			mNextGattHandle++;
		} catch(Exception e) {
			callbackContext.error(e.toString());
		}
	}

	private void rssi(final CordovaArgs args, final CallbackContext callbackContext) {
		try {
			GattHandler gh = mGatt.get(args.getInt(0));
			gh.mRssiContext = callbackContext;
			if(!gh.mGatt.readRemoteRssi()) {
				callbackContext.error("readRemoteRssi");
			}
		} catch(Exception e) {
			callbackContext.error(e.toString());
		}
	}

	private void services(final CordovaArgs args, final CallbackContext callbackContext) {
		try {
			final GattHandler gh = mGatt.get(args.getInt(0));
			gh.mOperations.add(new Runnable() {
				@Override
				public void run() {
					gh.mCurrentOpContext = callbackContext;
					if(!gh.mGatt.discoverServices()) {
						gh.mCurrentOpContext = null;
						callbackContext.error("discoverServices");
						gh.process();
					}
				}
			});
			gh.process();
		} catch(Exception e) {
			callbackContext.error(e.toString());
		}
	}

	private void characteristics(final CordovaArgs args, final CallbackContext callbackContext) throws JSONException {
		final GattHandler gh = mGatt.get(args.getInt(0));
		for(BluetoothGattCharacteristic c : gh.mServices.get(args.getInt(1)).getCharacteristics()) {
			if(gh.mCharacteristics == null)
				gh.mCharacteristics = new HashMap<Integer, BluetoothGattCharacteristic>();
			Object res = gh.mCharacteristics.put(gh.mNextHandle, c);
			assert(res == null);

			JSONObject o = new JSONObject();
			o.put("handle", gh.mNextHandle);
			o.put("uuid", c.getUuid().toString());
			o.put("permissions", c.getPermissions());
			o.put("properties", c.getProperties());
			o.put("writeType", c.getWriteType());
			o.put("descriptorCount", c.getDescriptors().size());

			gh.mNextHandle++;
			keepCallback(callbackContext, o);
		}
	}

	private void descriptors(final CordovaArgs args, final CallbackContext callbackContext) throws JSONException {
		final GattHandler gh = mGatt.get(args.getInt(0));
		for(BluetoothGattDescriptor d : gh.mCharacteristics.get(args.getInt(1)).getDescriptors()) {
			if(gh.mDescriptors == null)
				gh.mDescriptors = new HashMap<Integer, BluetoothGattDescriptor>();
			Object res = gh.mDescriptors.put(gh.mNextHandle, d);
			assert(res == null);

			JSONObject o = new JSONObject();
			o.put("handle", gh.mNextHandle);
			o.put("uuid", d.getUuid().toString());
			o.put("permissions", d.getPermissions());

			gh.mNextHandle++;
			keepCallback(callbackContext, o);
		}
	}

	private void readCharacteristic(final CordovaArgs args, final CallbackContext callbackContext) throws JSONException {
		final GattHandler gh = mGatt.get(args.getInt(0));
		gh.mOperations.add(new Runnable() {
			@Override
			public void run() {
				try {
					gh.mCurrentOpContext = callbackContext;
					if(!gh.mGatt.readCharacteristic(gh.mCharacteristics.get(args.getInt(1)))) {
						gh.mCurrentOpContext = null;
						callbackContext.error("readCharacteristic");
						gh.process();
					}
				} catch(JSONException e) {
					callbackContext.error(e.toString());
					gh.process();
				}
			}
		});
		gh.process();
	}

	private void readDescriptor(final CordovaArgs args, final CallbackContext callbackContext) throws JSONException {
		final GattHandler gh = mGatt.get(args.getInt(0));
		gh.mOperations.add(new Runnable() {
			@Override
			public void run() {
				try {
					gh.mCurrentOpContext = callbackContext;
					if(!gh.mGatt.readDescriptor(gh.mDescriptors.get(args.getInt(1)))) {
						gh.mCurrentOpContext = null;
						callbackContext.error("readDescriptor");
						gh.process();
					}
				} catch(JSONException e) {
					callbackContext.error(e.toString());
					gh.process();
				}
			}
		});
		gh.process();
	}

	private void writeCharacteristic(final CordovaArgs args, final CallbackContext callbackContext) throws JSONException {
		final GattHandler gh = mGatt.get(args.getInt(0));
		gh.mOperations.add(new Runnable() {
			@Override
			public void run() {
				try {
					gh.mCurrentOpContext = callbackContext;
					BluetoothGattCharacteristic c = gh.mCharacteristics.get(args.getInt(1));
					System.out.println("writeCharacteristic("+args.getInt(0)+", "+args.getInt(1)+", "+args.getString(2)+")");
					c.setValue(args.getArrayBuffer(2));
					if(!gh.mGatt.writeCharacteristic(c)) {
						gh.mCurrentOpContext = null;
						callbackContext.error("writeCharacteristic");
						gh.process();
					}
				} catch(JSONException e) {
					callbackContext.error(e.toString());
					gh.process();
				}
			}
		});
		gh.process();
	}

	private void writeDescriptor(final CordovaArgs args, final CallbackContext callbackContext) throws JSONException {
		final GattHandler gh = mGatt.get(args.getInt(0));
		gh.mOperations.add(new Runnable() {
			@Override
			public void run() {
				try {
					gh.mCurrentOpContext = callbackContext;
					BluetoothGattDescriptor d = gh.mDescriptors.get(args.getInt(1));
					d.setValue(args.getArrayBuffer(2));
					if(!gh.mGatt.writeDescriptor(d)) {
						gh.mCurrentOpContext = null;
						callbackContext.error("writeDescriptor");
						gh.process();
					}
				} catch(JSONException e) {
					callbackContext.error(e.toString());
					gh.process();
				}
			}
		});
		gh.process();
	}

	private void enableNotification(final CordovaArgs args, final CallbackContext callbackContext) throws JSONException {
		final GattHandler gh = mGatt.get(args.getInt(0));
		BluetoothGattCharacteristic c = gh.mCharacteristics.get(args.getInt(1));
		gh.mNotifications.put(c, callbackContext);
		if(!gh.mGatt.setCharacteristicNotification(c, true)) {
			callbackContext.error("setCharacteristicNotification");
		}
	}

	private void disableNotification(final CordovaArgs args, final CallbackContext callbackContext) throws JSONException {
		final GattHandler gh = mGatt.get(args.getInt(0));
		BluetoothGattCharacteristic c = gh.mCharacteristics.get(args.getInt(1));
		gh.mNotifications.remove(c);
		if(gh.mGatt.setCharacteristicNotification(c, false)) {
			callbackContext.success();
		} else {
			callbackContext.error("setCharacteristicNotification");
		}
	}

	private void testCharConversion(final CordovaArgs args, final CallbackContext callbackContext) throws JSONException {
		byte[] b = {(byte)args.getInt(0)};
		callbackContext.success(b);
	}

	private void reset(final CordovaArgs args, final CallbackContext cc) throws JSONException {
		mResetCallbackContext = null;
		BluetoothAdapter a = BluetoothAdapter.getDefaultAdapter();
		if(mScanCallbackContext != null) {
			a.stopLeScan(this);
			mScanCallbackContext = null;
		}
		int state = a.getState();
		//STATE_OFF, STATE_TURNING_ON, STATE_ON, STATE_TURNING_OFF.
		if(state == BluetoothAdapter.STATE_TURNING_ON) {
			// reset in progress; wait for STATE_ON.
			mResetCallbackContext = cc;
			return;
		}
		if(state == BluetoothAdapter.STATE_TURNING_OFF) {
			// reset in progress; wait for STATE_OFF.
			mResetCallbackContext = cc;
			return;
		}
		if(state == BluetoothAdapter.STATE_OFF) {
			boolean res = a.enable();
			if(res) {
				mResetCallbackContext = cc;
			} else {
				cc.error("enable");
			}
			return;
		}
		if(state == BluetoothAdapter.STATE_ON) {
			boolean res = a.disable();
			if(res) {
				mResetCallbackContext = cc;
			} else {
				cc.error("disable");
			}
			return;
		}
		cc.error("Unknown state: "+state);
	}

	class BluetoothStateReceiver extends BroadcastReceiver {
		public void onReceive(Context context, Intent intent) {
			BluetoothAdapter a = BluetoothAdapter.getDefaultAdapter();
			int state = a.getState();
			System.out.println("BluetoothState: "+a);
			if(mResetCallbackContext != null) {
				if(state == BluetoothAdapter.STATE_OFF) {
					boolean res = a.enable();
					if(!res) {
						mResetCallbackContext.error("enable");
						mResetCallbackContext = null;
					}
				}
				if(state == BluetoothAdapter.STATE_ON) {
					mResetCallbackContext.success();
					mResetCallbackContext = null;
				}
			}
		}
	};

	/* Running more than one operation of certain types on remote Gatt devices
	* seem to cause it to stop responding.
	* The known types are 'read' and 'write'.
	* I've added 'services' to be on the safe side.
	* 'rssi' and 'notification' should be safe.
	*/
	private class GattHandler extends BluetoothGattCallback {
		final int mHandle;
		LinkedList<Runnable> mOperations = new LinkedList<Runnable>();
		CallbackContext mConnectContext, mRssiContext, mCurrentOpContext;
		BluetoothGatt mGatt;
		int mNextHandle = 1;
		HashMap<Integer, BluetoothGattService> mServices;
		HashMap<Integer, BluetoothGattCharacteristic> mCharacteristics;
		HashMap<Integer, BluetoothGattDescriptor> mDescriptors;
		HashMap<BluetoothGattCharacteristic, CallbackContext> mNotifications =
			new HashMap<BluetoothGattCharacteristic, CallbackContext>();

		GattHandler(int h, CallbackContext cc) {
			mHandle = h;
			mConnectContext = cc;
		}

		void process() {
			if(mCurrentOpContext != null)
				return;
			Runnable r = mOperations.poll();
			if(r == null)
				return;
			r.run();
		}

		@Override
		public void onConnectionStateChange(BluetoothGatt gatt, int status, int newState) {
			if(status == BluetoothGatt.GATT_SUCCESS) {
				try {
					JSONObject o = new JSONObject();
					o.put("device", mHandle);
					o.put("state", newState);
					keepCallback(mConnectContext, o);
				} catch(JSONException e) {
					assert(false);
				}
			} else {
				mConnectContext.error(status);
			}
		}
		@Override
		public void onReadRemoteRssi(BluetoothGatt g, int rssi, int status) {
			if(status == BluetoothGatt.GATT_SUCCESS) {
				mRssiContext.success(rssi);
			} else {
				mRssiContext.error(status);
			}
		}
		@Override
		public void onServicesDiscovered(BluetoothGatt g, int status) {
			if(status == BluetoothGatt.GATT_SUCCESS) {
				List<BluetoothGattService> services = g.getServices();
				for(BluetoothGattService s : services) {
					// give the service a handle.
					if(mServices == null)
						mServices = new HashMap<Integer, BluetoothGattService>();
					Object res = mServices.put(mNextHandle, s);
					assert(res == null);

					try {
						JSONObject o = new JSONObject();
						o.put("handle", mNextHandle);
						o.put("uuid", s.getUuid().toString());
						o.put("type", s.getType());
						o.put("characteristicCount", s.getCharacteristics().size());
						o.put("serviceCount", services.size());

						mNextHandle++;
						keepCallback(mCurrentOpContext, o);
					} catch(JSONException e) {
						assert(false);
					}
				}
			} else {
				mCurrentOpContext.error(status);
			}
			mCurrentOpContext = null;
			process();
		}
		@Override
		public void onCharacteristicRead(BluetoothGatt g, BluetoothGattCharacteristic c, int status) {
			if(status == BluetoothGatt.GATT_SUCCESS) {
				mCurrentOpContext.success(c.getValue());
			} else {
				mCurrentOpContext.error(status);
			}
			mCurrentOpContext = null;
			process();
		}
		@Override
		public void onDescriptorRead(BluetoothGatt g, BluetoothGattDescriptor d, int status) {
			if(status == BluetoothGatt.GATT_SUCCESS) {
				mCurrentOpContext.success(d.getValue());
			} else {
				mCurrentOpContext.error(status);
			}
			mCurrentOpContext = null;
			process();
		}
		@Override
		public void onCharacteristicWrite(BluetoothGatt g, BluetoothGattCharacteristic c, int status) {
			if(status == BluetoothGatt.GATT_SUCCESS) {
				mCurrentOpContext.success();
			} else {
				mCurrentOpContext.error(status);
			}
			mCurrentOpContext = null;
			process();
		}
		@Override
		public void onDescriptorWrite(BluetoothGatt g, BluetoothGattDescriptor d, int status) {
			if(status == BluetoothGatt.GATT_SUCCESS) {
				mCurrentOpContext.success();
			} else {
				mCurrentOpContext.error(status);
			}
			mCurrentOpContext = null;
			process();
		}
		@Override
		public void onCharacteristicChanged(BluetoothGatt g, BluetoothGattCharacteristic c) {
			CallbackContext cc = mNotifications.get(c);
			keepCallback(cc, c.getValue());
		}
	};
}
