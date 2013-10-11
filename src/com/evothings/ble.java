
import org.apache.cordova.*;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

public class ChromeNotifications extends CordovaPlugin implements LeScanCallback {
	// for running stuff in a separate thread.
	private ExecutorService mExecutorService;

	private CallbackContext mScanCallbackContext;

	int mNextGattHandle = 1;
	HashMap<Integer, GattHandler> mGatt = null;


	@Override
	public void initialize(final CordovaInterface cordova, CordovaWebView webView) {
		super.initialize(cordova, webView);
		mExecutorService = cordova.getThreadPool();
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
		return false;
	}

	private void startScan(final CordovaArgs args, final CallbackContext callbackContext) {
		try {
			BluetoothAdapter adapter = BluetoothAdapter.getDefaultAdapter();
			if(!adapter.startLeScan(this)) {
				callbackContext.error("startLeScan failed.");
				return;
			}
			mScanCallbackContext = callbackContext;
		} catch(Exception e) {
			callbackContext.error(e);
		}
	}

	private void onLeScan(BluetoothDevice device, int rssi, byte[] scanRecord) {
		mScanCallbackContext.success(device.getAddress(), rssi, device.getName(), scanRecord);
	}

	private void stopScan(final CordovaArgs args, final CallbackContext callbackContext) {
		BluetoothAdapter adapter = BluetoothAdapter.getDefaultAdapter();
		adapter.stopLeScan(this);
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
			callbackContext.error(e);
		}
	}

	private void rssi(final CordovaArgs args, final CallbackContext callbackContext) {
		try {
			GattHandler gh = mGatt.get(args.getInt(0));
			gh.mRssiContext = callbackContext;
			if(!gh.readRemoteRssi()) {
				callbackContext.error("readRemoteRssi");
			}
		} catch(Exception e) {
			callbackContext.error(e);
		}
	}

	private void services(final CordovaArgs args, final CallbackContext callbackContext) {
		try {
			GattHandler gh = mGatt.get(args.getInt(0));
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
			}
			gh.process();
		} catch(Exception e) {
			callbackContext.error(e);
		}
	}

	private void characteristics(final CordovaArgs args, final CallbackContext callbackContext) {
		GattHandler gh = mGatt.get(args.getInt(0));
		for(BluetoothGattCharacteristic c : gh.mServices.get(args.getInt(1)).getCharacteristics()) {
			if(mCharacteristics == null)
				mCharacteristics = new HashMap<Integer, BluetoothGattCharacteristic>();
			Object res = mCharacteristics.put(mNextHandle, c);
			assert(res == null);

			JSONObject o = new JSONObject();
			o.put("handle", gh.mNextHandle);
			o.put("uuid", c.getUuid().toString());
			o.put("permissions", c.getPermissions());
			o.put("properties", c.getProperties());
			o.put("writeType", c.getWriteType());
			o.put("descriptorCount", c.getDescriptors().size());

			gh.mNextHandle++;
			callbackContext.success(o);
		}
	}

	private void descriptors(final CordovaArgs args, final CallbackContext callbackContext) {
		GattHandler gh = mGatt.get(args.getInt(0));
		for(BluetoothGattDescriptor c : gh.mCharacteristics.get(args.getInt(1)).getDescriptors()) {
			if(mDescriptors == null)
				mDescriptors = new HashMap<Integer, BluetoothGattDescriptor>();
			Object res = mCharacteristics.put(mNextHandle, c);
			assert(res == null);

			JSONObject o = new JSONObject();
			o.put("handle", gh.mNextHandle);
			o.put("uuid", d.getUuid().toString());
			o.put("permissions", d.getPermissions());

			gh.mNextHandle++;
			callbackContext.success(o);
		}
	}

	private void readCharacteristic(final CordovaArgs args, final CallbackContext callbackContext) {
		try {
			GattHandler gh = mGatt.get(args.getInt(0));
			gh.mOperations.add(new Runnable() {
				@Override
				public void run() {
					gh.mCurrentOpContext = callbackContext;
					if(!gh.mGatt.readCharacteristic(gh.mCharacteristics.get(args.getInt(1)))) {
						gh.mCurrentOpContext = null;
						callbackContext.error("readCharacteristic");
						gh.process();
					}
				}
			}
			gh.process();
		} catch(Exception e) {
			callbackContext.error(e);
		}
	}

	private void readDescriptor(final CordovaArgs args, final CallbackContext callbackContext) {
		GattHandler gh = mGatt.get(args.getInt(0));
		gh.mOperations.add(new Runnable() {
			@Override
			public void run() {
				gh.mCurrentOpContext = callbackContext;
				if(!gh.mGatt.readDescriptor(gh.mDescriptors.get(args.getInt(1)))) {
					gh.mCurrentOpContext = null;
					callbackContext.error("readDescriptor");
					gh.process();
				}
			}
		}
		gh.process();
	}

	private void writeCharacteristic(final CordovaArgs args, final CallbackContext callbackContext) {
		GattHandler gh = mGatt.get(args.getInt(0));
		gh.mOperations.add(new Runnable() {
			@Override
			public void run() {
				gh.mCurrentOpContext = callbackContext;
				BluetoothGattCharacteristic c = gh.mDescriptors.get(args.getInt(1));
				String v = args.getString(2);
				String charset = args.getString(3);
				byte[] bytes;
				if(charset == null) {
					bytes = v.getBytes();
				} else {
					bytes = v.getBytes(charset);
				}
				c.setValue(bytes);
				if(!gh.mGatt.writeCharacteristic(c)) {
					gh.mCurrentOpContext = null;
					callbackContext.error("writeCharacteristic");
					gh.process();
				}
			}
		}
		gh.process();
	}

	/* Running more than one operation of certain types on remote Gatt devices
	* seem to cause it to stop responding.
	* The known types are 'read' and 'write'.
	* I've added 'services' and 'notification' to be on the safe side.
	* 'rssi' should be safe.
	*/
	private class GattHandler extends BluetoothGattCallback {
		final int mHandle;
		LinkedList<Runnable> mOperations = new LinkedList<Runnable>;
		CallbackContext mConnectContext, mRssiContext, mCurrentOpContext;
		BluetoothGatt mGatt;
		int mNextHandle = 1;
		HashMap<Integer, BluetoothGattService> mServices;
		HashMap<Integer, BluetoothGattCharacteristic> mCharacteristics;
		HashMap<Integer, BluetoothGattDescriptor> mDescriptors;
		HashMap<BluetoothGattCharacteristic, CallbackContext> mNotifications;

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
			if(status == GATT_SUCCESS) {
				mConnectContext.success(mHandle, newState);
			} else {
				mConnectContext.error(status);
			}
		}
		@Override
		public void onReadRemoteRssi(BluetoothGatt g, int rssi, int status) {
			if(status == GATT_SUCCESS) {
				mRssiContext.success(rssi);
			} else {
				mRssiContext.error(status);
			}
		}
		@Override
		public void onServicesDiscovered(BluetoothGatt g, int status) {
			if(status == GATT_SUCCESS) {
				for(BluetoothGattService s : g.getServices()) {
					// give the service a handle.
					if(mServices == null)
						mServices = new HashMap<Integer, BluetoothGattService>();
					Object res = mServices.put(mNextHandle, s);
					assert(res == null);

					JSONObject o = new JSONObject();
					o.put("handle", mNextHandle);
					o.put("uuid", s.getUuid().toString());
					o.put("type", s.getType());
					o.put("characteristicCount", s.getCharacteristics().size());

					mNextHandle++;
					mCurrentOpContext.success(o);
				}
			} else {
				mCurrentOpContext.error(status);
			}
			mCurrentOpContext = null;
			process();
		}
		@Override
		public void onCharacteristicRead(BluetoothGatt g, BluetoothGattCharacteristic c, int status) {
			if(status == GATT_SUCCESS) {
				mCurrentOpContext.success(c.getValue());
			} else {
				mCurrentOpContext.error(status);
			}
			mCurrentOpContext = null;
			process();
		}
		@Override
		public void onDescriptorRead(BluetoothGatt g, BluetoothGattDescriptor d, int status) {
			if(status == GATT_SUCCESS) {
				mCurrentOpContext.success(d.getValue());
			} else {
				mCurrentOpContext.error(status);
			}
			mCurrentOpContext = null;
			process();
		}
		@Override
		public void onCharacteristicWrite(BluetoothGatt g, BluetoothGattCharacteristic c, int status) {
			if(status == GATT_SUCCESS) {
				mCurrentOpContext.success();
			} else {
				mCurrentOpContext.error(status);
			}
			mCurrentOpContext = null;
			process();
		}
		@Override
		public void onDescriptorWrite(BluetoothGatt g, BluetoothGattDescriptor d, int status) {
			if(status == GATT_SUCCESS) {
				mCurrentOpContext.success();
			} else {
				mCurrentOpContext.error(status);
			}
			mCurrentOpContext = null;
			process();
		}
		@Override
		public void onCharacteristicChanged(BluetoothGatt g, BluetoothGattCharacteristic c) {
			mNotifications[c].success(c.getValue());
		}
	};
}
