function dashboard_compilation(arg, req, hlp)
  return {
    version = "1",
    options = {
      stacking = "none",
      numberOfColumns = 1,
      numberOfRows = { type = "count", value = 1 },
    },
    widgets = {
      {
        id = "hello",
        type = "text",
        captionBar = false,
        text = "Bayer diagnostic OK",
        layout = { x = 0, y = 0, w = 1, h = 1, static = true },
      },
    },
  }
end
