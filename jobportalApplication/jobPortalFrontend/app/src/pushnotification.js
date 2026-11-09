import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { sendNotification } from '../redux/notificationSlice';

export default function App() {
    const dispatch = useDispatch();

    // Extract state from Redux
    const { pushToken, receivedNotification, status } = useSelector((state) => state.notification);
    const user = useSelector((state) => state.auth?.user);

    const handleSendNotification = () => {
        if (user?._id) {
            dispatch(sendNotification({
                userId: user._id,
                title: 'Test Notification! 🎉',
                body: 'It works! You just received a push notification from the backend.',
                data: {
                    type: 'PROFILE',
                    userId: user._id
                }
            }));
        }
    };



    return (
        <View style={styles.container}>
            <Text style={styles.text}>
                Token in Redux: {pushToken || 'No token registered'}
            </Text>

            {receivedNotification && (
                <Text style={styles.text}>
                    Latest Notif: {receivedNotification.request.content.title}
                </Text>
            )}

            {pushToken && (
                <TouchableOpacity
                    style={[styles.button, status === 'loading' && styles.buttonDisabled]}
                    onPress={handleSendNotification}
                    disabled={status === 'loading'}
                >
                    {status === 'loading' ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <Text style={styles.buttonText}>Send Test Notification via Backend</Text>
                    )}
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    text: {
        textAlign: 'center',
        marginVertical: 5
    },
    button: {
        marginTop: 20,
        backgroundColor: '#6366F1',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        elevation: 3,
    },
    buttonDisabled: {
        backgroundColor: '#9CA3AF',
        elevation: 0,
    },
    buttonText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 16,
    }
});