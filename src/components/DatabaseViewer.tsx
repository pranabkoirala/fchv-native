import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Alert,
  Platform,
  Dimensions,
} from "react-native";
import {
  Database,
  X,
  RefreshCw,
  Search,
  Trash2,
  Code,
  Table as TableIcon,
  ChevronDown,
  ChevronUp,
} from "lucide-react-native";
import { getDb } from "@/hooks/database/db";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function DatabaseViewer({ onClose }: { onClose: () => void }) {
  const [tables, setTables] = useState<{ name: string }[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [tableData, setTableData] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [tableSearch, setTableSearch] = useState("");
  const [dataSearch, setDataSearch] = useState("");
  const [sqlMode, setSqlMode] = useState(false);
  const [customSql, setCustomSql] = useState("");
  const [sqlError, setSqlError] = useState<string | null>(null);

  useEffect(() => {
    loadTables();
  }, []);

  const loadTables = async () => {
    try {
      const db = await getDb();
      const result = await db.getAllAsync<{ name: string }>(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name != 'android_metadata'"
      );
      setTables(result);
      if (result.length > 0 && !selectedTable) {
        loadTableData(result[0].name);
      }
    } catch (e) {
      console.error("Error loading tables:", e);
    } finally {
      setInitializing(false);
    }
  };

  const loadTableData = async (tableName: string) => {
    setLoading(true);
    setSqlMode(false);
    setSelectedTable(tableName);
    try {
      const db = await getDb();
      const result = (await db.getAllAsync(`SELECT * FROM ${tableName}`)) as any[];
      setTableData(result);
      if (result.length > 0) {
        setColumns(Object.keys(result[0]));
      } else {
        // If empty, try to get columns from pragma
        const pragma = (await db.getAllAsync(`PRAGMA table_info(${tableName})`)) as any[];
        setColumns(pragma.map((c) => c.name));
      }
    } catch (e) {
      console.error("Error loading table data:", e);
      Alert.alert("Error", "Failed to load table data");
    } finally {
      setLoading(false);
    }
  };

  const runCustomSql = async () => {
    if (!customSql.trim()) return;
    setLoading(true);
    setSqlError(null);
    try {
      const db = await getDb();
      if (customSql.trim().toLowerCase().startsWith("select")) {
        const result = (await db.getAllAsync(customSql)) as any[];
        setTableData(result);
        if (result.length > 0) {
          setColumns(Object.keys(result[0]));
        } else {
          setColumns([]);
        }
      } else {
        await db.execAsync(customSql);
        Alert.alert("Success", "Query executed successfully");
        loadTables();
      }
    } catch (e: any) {
      setSqlError(e.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const deleteRow = async (row: any) => {
    if (!selectedTable) return;

    // Try to find a primary key or unique identifier
    const idKey = columns.includes("id") ? "id" : columns[0];
    const idValue = row[idKey];

    Alert.alert(
      "Confirm Delete",
      `Are you sure you want to delete this row where ${idKey} = ${idValue}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const db = await getDb();
              await db.runAsync(`DELETE FROM ${selectedTable} WHERE ${idKey} = ?`, [idValue]);
              loadTableData(selectedTable);
            } catch (e) {
              Alert.alert("Error", "Failed to delete row");
            }
          },
        },
      ]
    );
  };

  const filteredTables = tables.filter((t) =>
    t.name.toLowerCase().includes(tableSearch.toLowerCase())
  );

  const filteredData = useMemo(() => {
    if (!dataSearch) return tableData;
    return tableData.filter((row) =>
      Object.values(row).some((val) =>
        String(val).toLowerCase().includes(dataSearch.toLowerCase())
      )
    );
  }, [tableData, dataSearch]);

  if (initializing) {
    return (
      <View className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="text-slate-500 mt-4 font-medium">Initializing Database Viewer...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-50">
      {/* Header */}
      <View className="bg-white px-5 pt-4 pb-4 flex-row justify-between items-center border-b border-slate-200">
        <View className="flex-row items-center">
          <View className="bg-slate-100 p-2 rounded-xl mr-3">
            <Database size={20} color="#334155" />
          </View>
          <View>
            <Text className="text-slate-900 font-bold text-lg">DB Inspector</Text>
            <Text className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">
              {sqlMode ? "SQL Console" : `Table: ${selectedTable || "None"}`}
            </Text>
          </View>
        </View>
        <View className="flex-row items-center gap-2">
          <TouchableOpacity
            onPress={() => setSqlMode(!sqlMode)}
            className={`p-2 rounded-xl ${sqlMode ? "bg-slate-900" : "bg-slate-100"}`}
          >
            <Code size={18} color={sqlMode ? "white" : "#64748B"} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => (selectedTable ? loadTableData(selectedTable) : loadTables())}
            className="bg-slate-100 p-2 rounded-xl"
          >
            <RefreshCw size={18} color="#64748B" />
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} className="bg-slate-100 p-2 rounded-xl">
            <X size={18} color="#64748B" />
          </TouchableOpacity>
        </View>
      </View>

      <View className="flex-1 flex-row">
        {/* Sidebar - Tables List */}
        {!sqlMode && (
          <View className="w-24 bg-white border-r border-slate-200">
            <View className="p-2 border-b border-slate-100">
              <View className="bg-slate-50 rounded-lg flex-row items-center px-2 py-1">
                <Search size={12} color="#94A3B8" />
                <TextInput
                  placeholder="Find..."
                  className="flex-1 text-[10px] ml-1 h-6"
                  value={tableSearch}
                  onChangeText={setTableSearch}
                />
              </View>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {filteredTables.map((t, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => loadTableData(t.name)}
                  className={`px-3 py-4 border-b border-slate-50 ${
                    selectedTable === t.name ? "bg-blue-50" : ""
                  }`}
                >
                  <Text
                    className={`text-[10px] font-bold ${
                      selectedTable === t.name ? "text-blue-600" : "text-slate-600"
                    }`}
                    numberOfLines={1}
                  >
                    {t.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Content Area */}
        <View className="flex-1">
          {sqlMode ? (
            <View className="flex-1 p-4">
              <View className="bg-slate-900 rounded-2xl p-4 shadow-sm">
                <Text className="text-slate-400 text-[10px] font-bold uppercase mb-2">
                  Execute Custom SQL
                </Text>
                <TextInput
                  multiline
                  placeholder="SELECT * FROM table..."
                  placeholderTextColor="#475569"
                  className="text-white font-mono text-xs min-h-[100px] text-top"
                  value={customSql}
                  onChangeText={setCustomSql}
                />
                <TouchableOpacity
                  onPress={runCustomSql}
                  className="bg-blue-600 rounded-xl py-3 items-center mt-4"
                >
                  <Text className="text-white font-bold">Run Query</Text>
                </TouchableOpacity>
                {sqlError && (
                  <View className="mt-4 p-3 bg-rose-500/10 rounded-xl border border-rose-500/20">
                    <Text className="text-rose-500 font-mono text-[10px]">{sqlError}</Text>
                  </View>
                )}
              </View>

              <View className="mt-4 flex-row items-center justify-between px-1">
                <Text className="text-slate-500 text-xs font-bold uppercase">Results</Text>
                <Text className="text-slate-400 text-[10px]">{filteredData.length} rows found</Text>
              </View>
            </View>
          ) : (
            <View className="bg-white border-b border-slate-200 px-4 py-2 flex-row items-center">
              <Search size={16} color="#94A3B8" />
              <TextInput
                placeholder={`Search in ${selectedTable || "data"}...`}
                className="flex-1 ml-2 text-sm h-10 font-medium"
                value={dataSearch}
                onChangeText={setDataSearch}
              />
              <Text className="text-slate-400 text-[10px] font-bold ml-2">
                {filteredData.length} ROWS
              </Text>
            </View>
          )}

          {/* Data Table */}
          <View className="flex-1">
            {loading ? (
              <View className="flex-1 justify-center items-center">
                <ActivityIndicator size="small" color="#3B82F6" />
              </View>
            ) : filteredData.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                <View>
                  {/* Table Header */}
                  <View className="flex-row bg-slate-100 border-b border-slate-200">
                    <View className="w-12 items-center justify-center border-r border-slate-200 py-3">
                      <Text className="text-[10px] font-black text-slate-400">#</Text>
                    </View>
                    {columns.map((col, i) => (
                      <View
                        key={i}
                        className="w-32 px-4 justify-center border-r border-slate-200 py-3"
                      >
                        <Text className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                          {col}
                        </Text>
                      </View>
                    ))}
                    <View className="w-16 items-center justify-center py-3">
                      <Text className="text-[10px] font-black text-slate-400">ACT</Text>
                    </View>
                  </View>

                  {/* Table Rows */}
                  <ScrollView showsVerticalScrollIndicator={true}>
                    {filteredData.map((row, rowIndex) => (
                      <View
                        key={rowIndex}
                        className={`flex-row border-b border-slate-100 ${
                          rowIndex % 2 === 0 ? "bg-white" : "bg-slate-50/30"
                        }`}
                      >
                        <View className="w-12 items-center justify-center border-r border-slate-100 py-3">
                          <Text className="text-[10px] font-mono text-slate-400">
                            {rowIndex + 1}
                          </Text>
                        </View>
                        {columns.map((col, colIndex) => (
                          <View
                            key={colIndex}
                            className="w-32 px-4 justify-center border-r border-slate-100 py-3"
                          >
                            <Text
                              className={`text-[11px] font-medium ${
                                row[col] === null ? "text-rose-400 italic" : "text-slate-600"
                              }`}
                              numberOfLines={2}
                            >
                              {row[col] === null ? "NULL" : String(row[col])}
                            </Text>
                          </View>
                        ))}
                        <View className="w-16 items-center justify-center py-3">
                          <TouchableOpacity
                            onPress={() => deleteRow(row)}
                            className="bg-rose-50 p-1.5 rounded-lg"
                          >
                            <Trash2 size={14} color="#E11D48" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                    <View className="h-40" />
                  </ScrollView>
                </View>
              </ScrollView>
            ) : (
              <View className="flex-1 justify-center items-center p-10">
                <TableIcon size={48} color="#E2E8F0" strokeWidth={1} />
                <Text className="text-slate-400 font-medium text-center mt-4">
                  {selectedTable ? "No data found matching your search" : "Select a table to browse data"}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}
