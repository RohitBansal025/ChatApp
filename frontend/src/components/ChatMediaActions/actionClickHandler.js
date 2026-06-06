import { ShowSnackbar } from "../../redux/slices/userSlice";

const actionHandler = (type, dispatch) => {
  switch (type) {
    case "gaming":
      return null;

    // handling photo click
    case "photo":
      const acceptedFileTypes = [
        "image/png",
        "image/jpeg",
        "image/gif",
        "image/webp",
      ];

      const fileInput = document.createElement("input");
      fileInput.type = "file";
      fileInput.accept = acceptedFileTypes.join(",");
      fileInput.multiple = true;
      fileInput.click();

      // handling selected file
      fileInput.addEventListener("change", (e) => {
        const selectedFiles = Array.from(e.target.files);

        selectedFiles.forEach((img) => {
          if (!acceptedFileTypes.includes(img.type)) {
            dispatch(
              ShowSnackbar({
                severity: "info",
                message: "Selected file types are not allowed",
              })
            );
          }
        });
      });
      break;

    case "document":
      return null;

    case "contact":
      return null;

    default:
      break;
  }

  return null;
};

export default actionHandler;
