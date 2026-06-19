import Avatar from "@mui/material/Avatar";
import Chip from "@mui/material/Chip";
import { useTheme } from "@mui/material/styles";
import { GridCellParams, GridRowsProp, GridColDef } from "@mui/x-data-grid";
import { SparkLineChart } from "@mui/x-charts/SparkLineChart";

type SparkLineData = number[];

function getDaysInMonth(month: number, year: number) {
  const date = new Date(year, month, 0);
  const monthName = date.toLocaleDateString("en-US", {
    month: "short",
  });
  const daysInMonth = date.getDate();
  const days = [];
  let i = 1;
  while (days.length < daysInMonth) {
    days.push(`${monthName} ${i}`);
    i += 1;
  }
  return days;
}

function SparklineCell(params: GridCellParams<SparkLineData, any>) {
  const theme = useTheme();
  const data = getDaysInMonth(4, 2024);
  const { value, colDef } = params;

  if (!value || value.length === 0) {
    return null;
  }

  return (
    <div style={{ display: "flex", alignItems: "center", height: "100%" }}>
      <SparkLineChart
        data={value}
        width={colDef.computedWidth || 100}
        height={32}
        plotType="bar"
        showHighlight
        showTooltip
        color={theme.palette.primary.main}
        xAxis={{
          scaleType: "band",
          data,
        }}
      />
    </div>
  );
}

function renderStatus(status: "Online" | "Offline") {
  const colors: { [index: string]: "success" | "default" } = {
    Online: "success",
    Offline: "default",
  };

  return <Chip label={status} color={colors[status]} size="small" />;
}

export function renderAvatar(
  params: GridCellParams<{ name: string; color: string }, any, any>,
) {
  if (params.value == null) {
    return "";
  }

  return (
    <Avatar
      sx={{
        backgroundColor: params.value.color,
        width: "24px",
        height: "24px",
        fontSize: "0.85rem",
      }}
    >
      {params.value.name.toUpperCase().substring(0, 1)}
    </Avatar>
  );
}

export const columns: GridColDef[] = [
  { field: "pageTitle", headerName: "Page Title", flex: 1.5, minWidth: 200 },
  {
    field: "status",
    headerName: "Status",
    flex: 0.5,
    minWidth: 80,
    renderCell: (params) => renderStatus(params.value as any),
  },
  {
    field: "users",
    headerName: "Users",
    headerAlign: "right",
    align: "right",
    flex: 1,
    minWidth: 80,
  },
  {
    field: "eventCount",
    headerName: "Event Count",
    headerAlign: "right",
    align: "right",
    flex: 1,
    minWidth: 100,
  },
  {
    field: "viewsPerUser",
    headerName: "Views per User",
    headerAlign: "right",
    align: "right",
    flex: 1,
    minWidth: 120,
  },
  {
    field: "averageTime",
    headerName: "Average Time",
    headerAlign: "right",
    align: "right",
    flex: 1,
    minWidth: 100,
  },
  {
    field: "conversions",
    headerName: "Daily Conversions",
    flex: 1,
    minWidth: 150,
    renderCell: (params) => <SparklineCell {...params} />,
  },
];

export const rows: GridRowsProp = [
  {
    id: 1,
    pageTitle: "Homepage Overview",
    status: "Online",
    eventCount: 8345,
    users: 212423,
    viewsPerUser: 18.5,
    averageTime: "2m 15s",
    conversions: [
      469172, 488506, 592287, 617401, 640374, 632751, 668638, 807246, 749198,
      944863, 911787, 844815, 992022, 1143838, 1446926, 1267886, 1362511,
      1348746, 1560533, 1670690, 1695142, 1916613, 1823306, 1683646, 2025965,
      2529989, 3263473, 3296541, 3041524, 2599497,
    ],
  },
  {
    id: 2,
    pageTitle: "Product Details - Gadgets",
    status: "Online",
    eventCount: 5653,
    users: 172240,
    viewsPerUser: 9.7,
    averageTime: "2m 30s",
    conversions: [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 557488, 1341471, 2044561, 2206438,
    ],
  },
  {
    id: 3,
    pageTitle: "Checkout Process - Step 1",
    status: "Offline",
    eventCount: 3455,
    users: 58240,
    viewsPerUser: 15.2,
    averageTime: "2m 10s",
    conversions: [
      166896, 190041, 248686, 226746, 261744, 271890, 332176, 381123, 396435,
      495620, 520278, 460839, 704158, 559134, 681089, 712384, 765381, 771374,
      851314, 907947, 903675, 1049642, 1003160, 881573, 1072283, 1139115,
      1382701, 1395655, 1355040, 1381571,
    ],
  },
  {
    id: 4,
    pageTitle: "User Profile Dashboard",
    status: "Online",
    eventCount: 112543,
    users: 96240,
    viewsPerUser: 4.5,
    averageTime: "2m 40s",
    conversions: [
      264651, 311845, 436558, 439385, 520413, 533380, 562363, 533793, 558029,
      791126, 649082, 566792, 723451, 737827, 890859, 935554, 1044397, 1022973,
      1129827, 1145309, 1195630, 1358925, 1373160, 1172679, 1340106, 1396974,
      1623641, 1687545, 1581634, 1550291,
    ],
  },
  {
    id: 5,
    pageTitle: "Article Listing - Tech News",
    status: "Offline",
    eventCount: 3653,
    users: 142240,
    viewsPerUser: 3.1,
    averageTime: "2m 55s",
    conversions: [
      251871, 262216, 402383, 396459, 378793, 406720, 447538, 451451, 457111,
      589821, 640744, 504879, 626099, 662007, 754576, 768231, 833019, 851537,
      972306, 1014831, 1027570, 1189068, 1119099, 987244, 1197954, 1310721,
      1480816, 1577547, 1854053, 1791831,
    ],
  },
  {
    id: 6,
    pageTitle: "FAQs - Customer Support",
    status: "Online",
    eventCount: 106543,
    users: 15240,
    viewsPerUser: 7.2,
    averageTime: "2m 20s",
    conversions: [
      13671, 16918, 27272, 34315, 42212, 56369, 64241, 77857, 70680, 91093,
      108306, 94734, 132289, 133860, 147706, 158504, 192578, 207173, 220052,
      233496, 250091, 285557, 268555, 259482, 274019, 321648, 359801, 399502,
      447249, 497403,
    ],
  },
  {
    id: 7,
    pageTitle: "Product Comparison - Laptops",
    status: "Offline",
    eventCount: 7853,
    users: 32240,
    viewsPerUser: 6.5,
    averageTime: "2m 50s",
    conversions: [
      93682, 107901, 144919, 151769, 170804, 183736, 201752, 219792, 227887,
      295382, 309600, 278050, 331964, 356826, 404896, 428090, 470245, 485582,
      539056, 582112, 594289, 671915, 649510, 574911, 713843, 754965, 853020,
      916793, 960158, 984265,
    ],
  },
  {
    id: 8,
    pageTitle: "Shopping Cart - Electronics",
    status: "Online",
    eventCount: 8563,
    users: 48240,
    viewsPerUser: 4.3,
    averageTime: "3m 10s",
    conversions: [
      52394, 63357, 82800, 105466, 128729, 144472, 172148, 197919, 212302,
      278153, 290499, 249824, 317499, 333024, 388925, 410576, 462099, 488477,
      533956, 572307, 591019, 681506, 653332, 581234, 719038, 783496, 911609,
      973328, 1056071, 1112940,
    ],
  },
  {
    id: 9,
    pageTitle: "Payment Confirmation - Bank Transfer",
    status: "Offline",
    eventCount: 4563,
    users: 18240,
    viewsPerUser: 2.7,
    averageTime: "3m 25s",
    conversions: [
      15372, 16901, 25489, 30148, 40857, 51136, 64627, 75804, 89633, 100407,
      114908, 129957, 143568, 158509, 174822, 192488, 211512, 234702, 258812,
      284328, 310431, 338186, 366582, 396749, 428788, 462880, 499125, 537723,
      578884, 622825,
    ],
  },
  {
    id: 10,
    pageTitle: "Product Reviews - Smartphones",
    status: "Online",
    eventCount: 9863,
    users: 28240,
    viewsPerUser: 5.1,
    averageTime: "3m 05s",
    conversions: [
      70211, 89234, 115676, 136021, 158744, 174682, 192890, 218073, 240926,
      308190, 317552, 279834, 334072, 354955, 422153, 443911, 501486, 538091,
      593724, 642882, 686539, 788615, 754813, 687955, 883645, 978347, 1142551,
      1233074, 1278155, 1356724,
    ],
  },
  {
    id: 11,
    pageTitle: "Subscription Management - Services",
    status: "Offline",
    eventCount: 6563,
    users: 24240,
    viewsPerUser: 4.8,
    averageTime: "3m 15s",
    conversions: [
      49662, 58971, 78547, 93486, 108722, 124901, 146422, 167883, 189295,
      230090, 249837, 217828, 266494, 287537, 339586, 363299, 412855, 440900,
      490111, 536729, 580591, 671635, 655812, 576431, 741632, 819296, 971762,
      1052605, 1099234, 1173591,
    ],
  },
  {
    id: 12,
    pageTitle: "Order Tracking - Shipments",
    status: "Online",
    eventCount: 12353,
    users: 38240,
    viewsPerUser: 3.5,
    averageTime: "3m 20s",
    conversions: [
      29589, 37965, 55800, 64672, 77995, 91126, 108203, 128900, 148232, 177159,
      193489, 164471, 210765, 229977, 273802, 299381, 341092, 371567, 413812,
      457693, 495920, 564785, 541022, 491680, 618096, 704926, 833365, 904313,
      974622, 1036567,
    ],
  },
  {
    id: 13,
    pageTitle: "Customer Feedback - Surveys",
    status: "Offline",
    eventCount: 5863,
    users: 13240,
    viewsPerUser: 2.3,
    averageTime: "3m 30s",
    conversions: [
      8472, 9637, 14892, 19276, 23489, 28510, 33845, 39602, 45867, 52605, 59189,
      65731, 76021, 85579, 96876, 108515, 119572, 131826, 145328, 160192,
      176528, 196662, 217929, 239731, 262920, 289258, 315691, 342199, 370752,
      402319,
    ],
  },
  {
    id: 14,
    pageTitle: "Account Settings - Preferences",
    status: "Online",
    eventCount: 7853,
    users: 18240,
    viewsPerUser: 3.2,
    averageTime: "3m 15s",
    conversions: [
      15792, 16948, 22728, 25491, 28412, 31268, 34241, 37857, 42068, 46893,
      51098, 55734, 60780, 66421, 72680, 79584, 87233, 95711, 105285, 115814,
      127509, 140260, 154086, 169495, 186445, 205109, 225580, 247983, 272484,
      299280,
    ],
  },
  {
    id: 15,
    pageTitle: "Login Page - Authentication",
    status: "Offline",
    eventCount: 9563,
    users: 24240,
    viewsPerUser: 2.5,
    averageTime: "3m 35s",
    conversions: [
      25638, 28355, 42089, 53021, 66074, 80620, 97989, 118202, 142103, 166890,
      193869, 225467, 264089, 307721, 358059, 417835, 488732, 573924, 674878,
      794657, 938542, 1111291, 1313329, 1543835, 1812156, 2123349, 2484926,
      2907023, 3399566, 3973545,
    ],
  },
];
