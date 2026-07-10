-- DIAGNOSTIC STEP A — paste this alone into Script Library, save, reload Webstudio.
-- If you still see a blank screen, the problem is lib= URL / LuaModuleName (not the JSON).
--
-- Launch via Custom Properties (recommended — no custom lib registration):
--   obj=/System/Core/.../Auto Dashboard  name=Bayer Health Monitor
--
-- Or lib= only works when ScriptLibrary tables are on the ctx object (see docs/discovery/SCRIPT-LIBRARY-NOTES.md).

function dashboard_compilation(arg, req, hlp)
  return {
    version = "1",
    options = {
      stacking = "none",
      numberOfColumns = 1,
      numberOfRows = { type = "count", value = 1 },
      padding = { x = 0, y = 0 },
      spacing = { x = 0, y = 0 },
    },
    widgets = {
      {
        id = "hello",
        type = "text",
        captionBar = false,
        text = "Bayer diagnostic OK — script library is wired correctly",
        layout = { x = 0, y = 0, w = 1, h = 1, static = true },
        options = {
          style = {
            backgroundColor = "#10384f",
            color = "#ffffff",
            fontSize = "18px",
            fontWeight = "bold",
            padding = "24px",
          },
        },
      },
    },
  }
end
