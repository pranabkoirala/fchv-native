import { useLanguage } from "@/context/LanguageContext";
import React, { useEffect, useState } from "react";
import { Dimensions, Text, View } from "react-native";
import Animated, { Easing, useAnimatedProps, useSharedValue, withTiming } from "react-native-reanimated";
import Svg, { Line, Rect, Text as SvgText } from "react-native-svg";

const AnimatedRect = Animated.createAnimatedComponent(Rect);

interface TrendData {
  label: string;
  value: number;
}

interface TrendChartProps {
  pregnancyData: TrendData[];
  childData: TrendData[];
  motherData?: TrendData[];
}

const TrendChart = ({ pregnancyData, childData, motherData }: TrendChartProps) => {
  const { t } = useLanguage();
  const [containerWidth, setContainerWidth] = useState(Dimensions.get("window").width - 88);
  const height = 220;
  const paddingBottom = 40;
  const paddingTop = 20;
  const paddingLeft = 32; // Space for Y-axis
  const chartHeight = height - paddingBottom - paddingTop;
  const chartWidth = containerWidth - paddingLeft;

  // Calculate nice Y-axis ticks
  const maxDataVal = Math.max(
    ...pregnancyData.map((d) => d.value),
    ...childData.map((d) => d.value),
    ...(motherData ? motherData.map((d) => d.value) : []),
    5
  );

  // Round up to nearest multiple of 4 to have 4 even intervals
  const tickStep = Math.ceil(maxDataVal / 4);
  const maxVal = tickStep * 4;
  const yTicks = [0, tickStep, tickStep * 2, tickStep * 3, maxVal];

  const stepX = chartWidth / Math.max(pregnancyData.length, 1);

  // Animation values
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(1, { duration: 1000, easing: Easing.out(Easing.exp) });
  }, []);

  return (
    <View style={{ width: "100%" }} onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}>
      <Svg width="100%" height={height}>
        {/* Horizontal Grid Lines and Y-Axis */}
        {yTicks.map((val, i) => {
          const y = height - paddingBottom - (val / maxVal) * chartHeight;
          return (
            <React.Fragment key={`tick-${i}`}>
              <Line
                x1={paddingLeft}
                y1={y}
                x2={containerWidth}
                y2={y}
                stroke="#F8FAFC"
                strokeWidth={1.5}
              />
              <SvgText
                x={paddingLeft - 10}
                y={y + 4}
                fill="#94A3B8"
                fontSize="10"
                fontWeight="500"
                textAnchor="end"
              >
                {val}
              </SvgText>
            </React.Fragment>
          );
        })}

        {/* Bars */}
        {pregnancyData.map((d, i) => {
          const x = paddingLeft + (i + 0.5) * stepX;
          const barHeightMother = motherData ? (motherData[i]?.value / maxVal) * chartHeight : 0;
          const barHeightPreg = (d.value / maxVal) * chartHeight;
          const barHeightChild = (childData[i]?.value / maxVal) * chartHeight || 0;

          return (
            <React.Fragment key={i}>
              <AnimatedBar
                x={x - 17}
                y={height - paddingBottom}
                targetHeight={barHeightMother || 0}
                color="#10B981"
                progress={progress}
              />
              <AnimatedBar
                x={x - 5}
                y={height - paddingBottom}
                targetHeight={barHeightPreg}
                color="#475569"
                progress={progress}
              />
              <AnimatedBar
                x={x + 7}
                y={height - paddingBottom}
                targetHeight={barHeightChild}
                color="#87CEEB"
                progress={progress}
              />
              {/* Labels */}
              <SvgText
                x={x}
                y={height - 14}
                fill="#4d5664ff"
                fontSize={d.label.length > 5 ? 11 : 11}
                fontWeight="600"
                textAnchor="middle"
              >
                {d.label}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>

      {/* Legend */}
      <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4, paddingHorizontal: paddingLeft }}>
        <View style={{ flexDirection: "row", alignItems: "center", marginRight: 24 }}>
          <View style={{ width: 14, height: 14, marginRight: 8, backgroundColor: "#10B981", borderRadius: 7 }} />
          <Text style={{ color: "#334155", fontSize: 13, fontWeight: "500" }}>{t("dashboard.charts.mothers")}</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", marginRight: 24 }}>
          <View style={{ width: 14, height: 14, marginRight: 8, backgroundColor: "#475569", borderRadius: 7 }} />
          <Text style={{ color: "#334155", fontSize: 13, fontWeight: "500" }}>{t("dashboard.charts.pregnancies")}</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View style={{ width: 14, height: 14, marginRight: 8, backgroundColor: "#87CEEB", borderRadius: 7 }} />
          <Text style={{ color: "#334155", fontSize: 13, fontWeight: "500" }}>{t("dashboard.charts.children")}</Text>
        </View>
      </View>
    </View>
  );
};

const AnimatedBar = ({ x, y, targetHeight, color, progress }: any) => {
  const animatedProps = useAnimatedProps(() => {
    const currentHeight = targetHeight * progress.value;
    const finalHeight = currentHeight < 6 ? (currentHeight > 0 ? 6 : 0) : currentHeight;
    return {
      height: finalHeight,
      y: y - finalHeight,
    };
  });

  return <AnimatedRect x={x} width={10} rx={2} fill={color} animatedProps={animatedProps} />;
};

export default TrendChart;
