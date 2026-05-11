import React from "react";
import { View, Dimensions } from "react-native";
import LineChart from "react-native-chart-kit/dist/line-chart/LineChart";

interface TrendData {
  label: string;
  value: number | null;
}

interface TrendChartProps {
  data: TrendData[];
  color: string;
  label: string;
}

const TrendChart = ({ data, color, label }: TrendChartProps) => {
  const screenWidth = Dimensions.get("window").width - 40; // taking full width of the card

  // Filter out future months that have null values
  const validData = data.filter((d) => d.value !== null);
  
  // If no valid data, fallback to a single point to prevent crashes
  const displayData = validData.length > 0 ? validData : [{ label: "Jan", value: 0 }];

  const validValues = displayData.map((d) => d.value as number);
  const maxValue = validValues.length > 0 ? Math.max(...validValues) : 0;
  
  let chartSegments = 4;
  if (maxValue === 0) {
    chartSegments = 1;
  } else if (maxValue < 4) {
    chartSegments = maxValue;
  }

  // Prepare data for react-native-chart-kit
  const chartData = {
    labels: displayData.map((d) => d.label),
    datasets: [
      {
        data: validValues,
        color: (opacity = 1) => color,
        strokeWidth: 4, // Make line slightly thicker for nice appearance
      },
    ],
  };

  const chartConfig = {
    backgroundColor: "#ffffff",
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    decimalPlaces: 0,
    color: (opacity = 1) => color,
    labelColor: (opacity = 1) => `rgba(100, 116, 139, 1)`,
    propsForLabels: {
      fontSize: 10,
      fontWeight: "bold",
    },
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: "4",
      strokeWidth: "2",
      stroke: "#ffffff",
    },
    propsForBackgroundLines: {
      strokeDasharray: "4",
      stroke: "#e2e8f0", // slightly darker so it's visible
    },
    fillShadowGradient: color,
    fillShadowGradientOpacity: 0.2,
  };

  return (
    <View style={{ alignItems: "center" }}>
      <LineChart
        data={chartData}
        width={screenWidth}
        height={180}
        chartConfig={chartConfig}
        bezier
        style={{
          marginVertical: 8,
          paddingRight: 20, // Add a bit of padding to right so last label doesn't cut
          marginLeft: -10, // Adjust left margin to ensure left numbers and line aren't cut off
        }}
        segments={chartSegments}
        withInnerLines={true}
        withOuterLines={true} // Enabled to show the left vertical line
        withVerticalLines={false}
        withHorizontalLines={true}
        withDots={true}
        withShadow={true}
        fromZero={true}
      />
    </View>
  );
};

export default TrendChart;
