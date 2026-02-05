#include <napi.h>

// the function that js will call 
Napi::String SayHello(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  // validate input
  if (info.Length() < 1 || !info[0].IsString()) {
    Napi::TypeError::New(env, "String expected").ThrowAsJavaScriptException();
    return Napi::String::New(env, "");
  }
  
  // Get the name from JavaScript and convert to C++ string
  std::string name = info[0].As<Napi::String>().Utf8Value();
  //build string
  std::string result = "Hello, " + name + "!";
  
  // convet back to js string and return
  return Napi::String::New(env, result);
}

// export our function so JavaScript can use it
Napi::Object Init(Napi::Env env, Napi::Object exports) {
  exports.Set(Napi::String::New(env, "sayHello"),
              Napi::Function::New(env, SayHello));
  return exports;
}

// register the module
NODE_API_MODULE(hello, Init)