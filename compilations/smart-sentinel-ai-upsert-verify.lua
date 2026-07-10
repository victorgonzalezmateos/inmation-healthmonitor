local base = "/System/Core/_Global Core Logic/Development"

syslib.mass({
	{
		class = syslib.model.classes.GenFolder,
		operation = syslib.model.codes.MassOp.UPSERT,
		path = base .. "/Smart Sentinel AI",
		["ObjectName"] = "Smart Sentinel AI",
		["ScriptLibrary.LuaModuleMandatoryExecution"] = {
			false,
		},
		["ScriptLibrary.AdvancedLuaScript"] = {
			[=[
function dashboard_compilation(arg, req, hlp)
  -- Dashboard JSON is in CustomOptions.CustomProperties (name=Bayer Health Monitor).
  -- Launch: obj=Smart Sentinel AI&name=Bayer%20Health%20Monitor
  return nil
end

]=],
		},
		["ScriptLibrary.LuaModuleName"] = {
			"bayer.healthmonitor",
		},
		["CustomOptions.CustomProperties.CustomPropertyName"] = {
			"Bayer Health Monitor",
		},
		["CustomOptions.CustomProperties.CustomPropertyValue"] = {
			[=[
{
  "version": "1",
  "name": "Bayer Health Monitor",
  "description": "One-widget check that CustomPropertyValue was saved",
  "options": {
    "background": { "style": { "backgroundColor": "#ffffff" } },
    "margin": { "x": 0, "y": 0 },
    "numberOfColumns": 96,
    "numberOfRows": { "type": "count", "value": 20 },
    "padding": { "x": 8, "y": 8 },
    "spacing": { "x": 8, "y": 8 },
    "stacking": "none",
    "theme": "light"
  },
  "widgets": [
    {
      "id": "verify-paste",
      "type": "text",
      "captionBar": false,
      "text": "PASTE VERIFIED - if you see this, Custom Properties saved correctly. Next: paste smoke-test-minimal.json",
      "layout": { "x": 0, "y": 0, "w": 96, "h": 20, "static": true },
      "options": {
        "style": {
          "backgroundColor": "#16a34a",
          "color": "#ffffff",
          "fontSize": "24px",
          "fontWeight": "bold",
          "textAlign": "center",
          "padding": "48px"
        }
      }
    }
  ]
}

]=],
		},
	}
})
