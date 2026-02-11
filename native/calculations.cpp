#include <napi.h>
#include <queue>
#include <vector>
#include <cmath>

// max rates
int32_t MAX_PITCH_RATE = 60;
int32_t MAX_ROLL_RATE  = 120;
int32_t MAX_YAW_RATE   = 40;

// current angles
float pitchAngle = 0.0f;
float rollAngle  = 0.0f;
float yawAngle   = 0.0f;

// previous angles
float prevPitchAngle = 0.0f;
float prevRollAngle  = 0.0f;
float prevYawAngle   = 0.0f;

// convert JS array to C++ vector
std::vector<float> arrToVector(const Napi::Array& arr) {
    std::vector<float> vec;
    for (uint32_t i = 0; i < arr.Length(); ++i) {
        Napi::Value val = arr[i];
        if (val.IsNumber()) vec.push_back(val.As<Napi::Number>().FloatValue());
    }
    return vec;
}

// average array values
float avgArray(const std::vector<float>& arr) {
    if (arr.empty()) return 0.0f;
    float total = 0.0f;
    for (float v : arr) total += v;
    float avg = total / arr.size();
    return std::round(avg * 100.0f) / 100.0f;
}

// push value to queue keeping max size 50
void pushLimited(std::queue<float>& q, float val) {
    q.push(val);
    if (q.size() > 50) q.pop();
}

// main function called from JS
Napi::Value GivePacket(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 3 || !info[0].IsArray() || !info[1].IsArray() || !info[2].IsArray()) {
        Napi::TypeError::New(env, "Expected three arrays").ThrowAsJavaScriptException();
        return env.Null();
    }

    std::vector<float> lxVec = arrToVector(info[0].As<Napi::Array>());
    std::vector<float> lyVec = arrToVector(info[1].As<Napi::Array>());
    std::vector<float> rxVec = arrToVector(info[2].As<Napi::Array>());

    // average last 10 inputs
    float lxAvg = avgArray(lxVec);
    float lyAvg = avgArray(lyVec);
    float rxAvg = avgArray(rxVec);



    float dt = 0.016f;

    // convert stick averages to rates
    float pitchRateCmd = lyAvg * MAX_PITCH_RATE;
    float rollRateCmd  = lxAvg * MAX_ROLL_RATE;
    float yawRateCmd   = rxAvg * MAX_YAW_RATE;

    // integrate rates
    pitchAngle += pitchRateCmd * dt;
    rollAngle  += rollRateCmd  * dt;
    yawAngle   += yawRateCmd   * dt;

    //pitch stays at 90 or -90 bc you cant go any more thhan straight up or down
    if (pitchAngle > 90.0f) pitchAngle = 90.0f;
    if (pitchAngle < -90.0f) pitchAngle = -90.0f;

    //wrap at 180° or -180 for the other two so you can spin or do a cool roll
    while (rollAngle > 180.0f) rollAngle -= 360.0f;
    while (rollAngle < -180.0f) rollAngle += 360.0f;

    while (yawAngle > 180.0f) yawAngle -= 360.0f;
    while (yawAngle < -180.0f) yawAngle += 360.0f;

    prevPitchAngle = pitchAngle;
    prevRollAngle  = rollAngle;
    prevYawAngle   = yawAngle;

    float inputMagnitude = std::sqrt(lxAvg*lxAvg + lyAvg*lyAvg + rxAvg*rxAvg);

    Napi::Array result = Napi::Array::New(env, 7);
    result[(uint32_t)0] = Napi::Number::New(env, pitchAngle);
    result[(uint32_t)1] = Napi::Number::New(env, yawAngle);
    result[(uint32_t)2] = Napi::Number::New(env, rollAngle);
    result[(uint32_t)3] = Napi::Number::New(env, pitchRateCmd);
    result[(uint32_t)4] = Napi::Number::New(env, rollRateCmd);
    result[(uint32_t)5] = Napi::Number::New(env, yawRateCmd);
    result[(uint32_t)6] = Napi::Number::New(env, inputMagnitude);


    return result;
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
    exports.Set("givePacket", Napi::Function::New(env, GivePacket));
    return exports;
}

NODE_API_MODULE(calculations, Init)
