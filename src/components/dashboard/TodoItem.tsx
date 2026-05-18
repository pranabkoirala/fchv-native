import React, { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, TextInput, Animated } from "react-native";
import { Check, Trash2 } from "lucide-react-native";

interface TodoItemProps {
  todo: {
    id: string;
    task: string;
    is_completed: boolean | number;
  };
  onToggle: () => void;
  onDelete: () => void;
  onEdit: (text: string) => void;
  isEditing: boolean;
  setEditingId: (id: string | null) => void;
}

const TodoItem = ({
  todo,
  onToggle,
  onDelete,
  onEdit,
  isEditing,
  setEditingId,
}: TodoItemProps) => {
  const [text, setText] = useState(todo.task);
  const [lastTap, setLastTap] = useState(0);
  const [expanded, setExpanded] = useState(false);

  const checkAnim = useRef(new Animated.Value(todo.is_completed ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(checkAnim, {
      toValue: todo.is_completed ? 1 : 0,
      useNativeDriver: false,
    }).start();
  }, [todo.is_completed]);

  const handleTap = () => {
    const now = Date.now();
    if (lastTap && now - lastTap < 300) {
      setEditingId(todo.id);
      setLastTap(0);
    } else {
      setLastTap(now);
      setTimeout(() => {
        if (Date.now() - now >= 300) setExpanded(!expanded);
      }, 300);
    }
  };

  const bgColor = checkAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["transparent", "#10B981"]
  });

  const borderColor = checkAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["#CBD5E1", "transparent"]
  });

  const displayTaskTitle = (() => {
    try {
      const parsed = JSON.parse(todo.task);
      if (parsed && parsed.title) return parsed.title;
    } catch (e) {}
    return todo.task;
  })();

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={handleTap}
      style={{
        backgroundColor: "white",
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderRadius: 16,
        marginBottom: 8,
        flexDirection: "row",
        alignItems: "center",
        opacity: !!todo.is_completed ? 0.6 : 1,
      }}
    >
      <TouchableOpacity
        onPress={onToggle}
        activeOpacity={0.8}
        style={{ marginRight: 14 }}
      >
        <Animated.View
          style={{
            width: 24,
            height: 24,
            borderRadius: 8,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: bgColor,
            borderWidth: 2,
            borderColor: borderColor,
            transform: [{ scale: checkAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.2, 1] }) }]
          }}
        >
          <Animated.View style={{ opacity: checkAnim, transform: [{ scale: checkAnim }] }}>
            <Check size={14} color="white" strokeWidth={3} />
          </Animated.View>
        </Animated.View>
      </TouchableOpacity>

      <View style={{ flex: 1 }}>
        {isEditing ? (
          <TextInput
            autoFocus
            style={{ color: "#0F172A", fontSize: 15, fontWeight: "600", padding: 0 }}
            value={text}
            onChangeText={setText}
            onBlur={() => {
              onEdit(text);
              setEditingId(null);
            }}
            onSubmitEditing={() => {
              onEdit(text);
              setEditingId(null);
            }}
          />
        ) : (
          <Text
            style={{
              color: !!todo.is_completed ? "#94A3B8" : "#1E293B",
              fontSize: 15,
              fontWeight: "600",
              textDecorationLine: !!todo.is_completed ? "line-through" : "none",
            }}
            numberOfLines={expanded ? undefined : 1}
          >
            {displayTaskTitle}
          </Text>
        )}
      </View>

      <TouchableOpacity
        onPress={onDelete}
        style={{
          padding: 8,
          marginLeft: 8,
        }}
      >
        <Trash2 size={18} color="#E2E8F0" strokeWidth={2} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

export default TodoItem;
