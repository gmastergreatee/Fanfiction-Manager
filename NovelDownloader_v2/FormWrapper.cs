using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace NovelDownloader_v2
{
    public abstract class FormWrapper : Form
    {
        public event EventHandler OnCloseClick;

        public new void Show()
        {
            if (IsHandleCreated)
            {
                Invoke(new Action(() =>
                {
                    base.Show();
                }));
            }
            else
                base.Show();
        }

        public void CloseMe(object sender, EventArgs e)
        {
            Invoke(new Action(() =>
            {
                Hide();
            }));
            OnCloseClick?.Invoke(sender, e);
        }
    }
}
