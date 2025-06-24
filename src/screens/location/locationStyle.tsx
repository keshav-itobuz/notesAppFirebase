import { StyleSheet } from "react-native";

export const locationStyle = StyleSheet.create({
    mainContainer: {
        flex: 1,
        alignItems: 'center',
        backgroundColor: '#f7f8fa',
        paddingBlock: 10,
        rowGap: 10
    },
    locationFormContainer: {
        width: '96%',
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 10,
        elevation: 2,
        flexDirection: 'column',
        rowGap: 6
    },
    latLongContainer: {
        display: 'flex',
        flexDirection: 'row',
        columnGap: 10,
    },
    input: {
        borderColor: "#ddd",
        borderWidth: 1,
        paddingHorizontal: 10,
        borderRadius: 6,
    },
    locationRowContainer: {
        width: '96%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: '#ddd',
        padding: 10,
        borderRadius: 6,
        marginBottom: 10
    },
    locationData: {
        display: 'flex',
        flexDirection: 'column',
        rowGap: 5
    },
    locationActions: {
        flexDirection: 'row',
        columnGap: 10
    }
});
