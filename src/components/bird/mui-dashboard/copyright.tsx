import Typography from "@mui/material/Typography";
import Link from "@mui/material/Link";
import { SxProps, Theme } from "@mui/material/styles";

export default function Copyright(props: { sx?: SxProps<Theme> }) {
  return (
    <Typography
      variant="body2"
      align="center"
      sx={{ color: "text.secondary", ...props.sx }}
    >
      {"Copyright © "}
      <Link color="inherit" href="#">
        Your Website
      </Link>{" "}
      {new Date().getFullYear()}
      {"."}
    </Typography>
  );
}
