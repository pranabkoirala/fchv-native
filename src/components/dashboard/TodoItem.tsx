import React, { useState } from "react";
import { View, Text, TouchableOpacity, TextInput } from "react-native";
import { CheckCircle, Trash2 } from "lucide-react-native";

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

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={handleTap}
      style={{
        backgroundColor: "white",
        padding: 14,
        borderRadius: 14,
        marginBottom: 10,
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#F1F5F9",
        opacity: !!todo.is_completed ? 0.5 : 1,
        elevation: !!todo.is_completed ? 0 : 1,
      }}
    >
      <TouchableOpacity
        onPress={onToggle}
        style={{
          width: 34,
          height: 34,
          borderRadius: 10,
          alignItems: "center",
          justifyContent: "center",
          marginRight: 12,
          backgroundColor: !!todo.is_completed ? "#10B981" : "#F8FAFC",
          borderWidth: !!todo.is_completed ? 0 : 1,
          borderColor: "#E2E8F0",
        }}
      >
        <CheckCircle size={16} color={!!todo.is_completed ? "white" : "#CBD5E1"} strokeWidth={2} />
      </TouchableOpacity>

      <View style={{ flex: 1 }}>
        {isEditing ? (
          <TextInput
            autoFocus
            style={{ color: "#1E293B", fontSize: 14, fontWeight: "600", padding: 0 }}
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
              fontSize: 14,
              fontWeight: "600",
              textDecorationLine: !!todo.is_completed ? "line-through" : "none",
            }}
            numberOfLines={expanded ? undefined : 1}
          >
            {todo.task}
          </Text>
        )}
      </View>

      <TouchableOpacity
        onPress={onDelete}
        style={{
          padding: 6,
          marginLeft: 8,
          backgroundColor: "#FFF1F2",
          borderRadius: 16,
        }}
      >
        <Trash2 size={13} color="#F43F5E" strokeWidth={2} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

export default TodoItem;
