/**
 * A YAML primitive value.
 */
export type YamlPrimitive = string | number | boolean | null;
/**
 * A YAML object.
 */
export type YamlObject = {
  [key: string]: YamlValue;
};
/**
 * A YAML array.
 */
export type YamlArray = YamlValue[];
/**
 * Any valid YAML-compatible value used by Aerealith configuration files.
 */
export type YamlValue = YamlPrimitive | YamlObject | YamlArray;
